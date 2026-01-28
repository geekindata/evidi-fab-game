import azure.functions as func
import pyodbc  # type: ignore
import os
import json
import logging
import re
import traceback
import struct
from azure.identity import DefaultAzureCredential  # type: ignore

def mask_connection_string(conn_str: str) -> str:
    """Mask sensitive parts of connection string for logging."""
    # Mask server, database, user, password
    masked = re.sub(r'Server=([^;]+)', r'Server=***', conn_str)
    masked = re.sub(r'Database=([^;]+)', r'Database=***', masked)
    masked = re.sub(r'User ID=([^;]+)', r'User ID=***', masked)
    masked = re.sub(r'Password=([^;]+)', r'Password=***', masked)
    return masked

def normalize_connection_string_to_odbc(conn_str: str) -> str:
    """Convert ADO.NET format to ODBC format."""
    # Replace Data Source= with Server=
    conn_str = re.sub(r'Data Source=', 'Server=', conn_str, flags=re.IGNORECASE)
    # Replace Initial Catalog= with Database=
    conn_str = re.sub(r'Initial Catalog=', 'Database=', conn_str, flags=re.IGNORECASE)
    # Replace Encrypt=True with Encrypt=yes
    conn_str = re.sub(r'Encrypt=True', 'Encrypt=yes', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Encrypt=False', 'Encrypt=no', conn_str, flags=re.IGNORECASE)
    # Replace Trust Server Certificate=False with TrustServerCertificate=no
    conn_str = re.sub(r'Trust Server Certificate=False', 'TrustServerCertificate=no', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Trust Server Certificate=True', 'TrustServerCertificate=yes', conn_str, flags=re.IGNORECASE)
    return conn_str

def add_driver_to_connection_string(conn_str: str) -> str:
    """Add ODBC Driver 18 if not present."""
    if 'Driver=' not in conn_str:
        conn_str = 'Driver={ODBC Driver 18 for SQL Server};' + conn_str
    return conn_str

def get_db_connection():
    """Get database connection using Managed Identity or connection string."""
    conn_str = os.environ.get('SQL_CONNECTION_STRING', '')
    if not conn_str:
        raise ValueError("SQL_CONNECTION_STRING environment variable is not set")
    
    # Normalize connection string format
    conn_str = normalize_connection_string_to_odbc(conn_str)
    conn_str = add_driver_to_connection_string(conn_str)
    
    # Check if using Managed Identity (no User ID/Password in connection string)
    has_credentials = 'User ID=' in conn_str or 'Password=' in conn_str
    has_auth = 'Authentication=' in conn_str
    
    # In Azure Static Web Apps, use Managed Identity
    if not has_credentials and not has_auth:
        # Try Managed Identity
        try:
            credential = DefaultAzureCredential()
            token_bytes = credential.get_token("https://database.windows.net/.default").token.encode('utf-16-le')
            token_struct = struct.pack(f'<I{len(token_bytes)}s', len(token_bytes), token_bytes)
            
            # Remove Authentication= if present, we'll use token
            conn_str_clean = re.sub(r'Authentication=[^;]+;?', '', conn_str)
            conn_str_clean = conn_str_clean.rstrip(';')
            
            conn = pyodbc.connect(conn_str_clean, attrs_before={1256: token_struct})
            logging.info("✅ Connected using Managed Identity")
            return conn
        except Exception as e:
            logging.warning(f"⚠️ Managed Identity failed: {e}, trying connection string...")
    
    # Fallback to connection string authentication
    try:
        conn = pyodbc.connect(conn_str, timeout=30)
        logging.info("✅ Connected using connection string")
        return conn
    except Exception as e:
        logging.error(f"❌ Connection failed: {e}")
        raise

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Azure Function to save user data to SQL database."""
    logging.info("POST /api/save - Received request")
    
    try:
        # Get JSON data
        data = req.get_json()
        if not data:
            logging.error("❌ No JSON data received")
            return func.HttpResponse(
                json.dumps({'error': 'No data received'}),
                status_code=400,
                mimetype='application/json'
            )
        
        logging.info(f"Received data: {json.dumps({k: v for k, v in data.items() if k != 'password'}, indent=2)}")
        
        # Extract fields
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        fabric_experience = data.get('fabricExperience', '').strip()
        description = data.get('description', '').strip()
        can_contact = data.get('canContact', '').strip()
        
        # Validate required fields
        if not all([name, email, fabric_experience, description, can_contact]):
            logging.error("❌ Missing required fields")
            return func.HttpResponse(
                json.dumps({'error': 'All fields are required'}),
                status_code=400,
                mimetype='application/json'
            )
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists, create if not
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GameUsers]') AND type in (N'U'))
            CREATE TABLE [dbo].[GameUsers](
                [Id] [int] IDENTITY(1,1) NOT NULL,
                [Name] [nvarchar](100) NOT NULL,
                [Email] [nvarchar](255) NOT NULL,
                [FabricExperience] [nvarchar](200) NOT NULL,
                [Description] [nvarchar](500) NOT NULL,
                [CanContact] [nvarchar](10) NOT NULL,
                [CreatedAt] [datetime2](7) NULL DEFAULT (getutcdate()),
                PRIMARY KEY CLUSTERED ([Id] ASC)
            )
        """)
        conn.commit()
        
        # Insert user data
        cursor.execute("""
            INSERT INTO [dbo].[GameUsers] (Name, Email, FabricExperience, Description, CanContact)
            VALUES (?, ?, ?, ?, ?)
        """, name, email, fabric_experience, description, can_contact)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        logging.info(f"✅ Successfully saved user: {name} ({email})")
        
        return func.HttpResponse(
            json.dumps({
                'success': True,
                'message': 'Data saved successfully!'
            }),
            status_code=200,
            mimetype='application/json'
        )
        
    except Exception as e:
        error_msg = str(e)
        error_traceback = traceback.format_exc()
        logging.error(f"❌ Error saving user: {error_msg}")
        logging.error(f"Traceback: {error_traceback}")
        
        # Ensure we always return a valid response
        try:
            error_response = {
                'success': False,
                'error': 'Failed to save data to database',
                'details': error_msg
            }
            return func.HttpResponse(
                json.dumps(error_response),
                status_code=500,
                mimetype='application/json'
            )
        except Exception as response_error:
            # If JSON encoding fails, return plain text
            logging.error(f"Failed to create error response: {response_error}")
            return func.HttpResponse(
                f"Error: {error_msg}",
                status_code=500,
                mimetype='text/plain'
            )
