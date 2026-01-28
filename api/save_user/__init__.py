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
    logging.info("=" * 60)
    logging.info("get_db_connection() called")
    logging.info("=" * 60)
    
    conn_str = os.environ.get('SQL_CONNECTION_STRING', '')
    logging.info(f"Step 1: Checking SQL_CONNECTION_STRING environment variable...")
    logging.info(f"  - Variable exists: {bool(conn_str)}")
    logging.info(f"  - Length: {len(conn_str) if conn_str else 0}")
    
    if not conn_str:
        logging.error("❌ SQL_CONNECTION_STRING environment variable is NOT set!")
        raise ValueError("SQL_CONNECTION_STRING environment variable is not set")
    
    logging.info(f"Step 2: Normalizing connection string format...")
    logging.info(f"  - Original (masked): {mask_connection_string(conn_str)}")
    
    # Normalize connection string format
    conn_str = normalize_connection_string_to_odbc(conn_str)
    logging.info(f"  - After normalization (masked): {mask_connection_string(conn_str)}")
    
    conn_str = add_driver_to_connection_string(conn_str)
    logging.info(f"  - After adding driver (masked): {mask_connection_string(conn_str)}")
    
    # Check if using Managed Identity (no User ID/Password in connection string)
    has_credentials = 'User ID=' in conn_str or 'Password=' in conn_str
    has_auth = 'Authentication=' in conn_str
    
    logging.info(f"Step 3: Checking authentication method...")
    logging.info(f"  - Has credentials (User ID/Password): {has_credentials}")
    logging.info(f"  - Has Authentication parameter: {has_auth}")
    
    # In Azure Static Web Apps, use Managed Identity
    if not has_credentials and not has_auth:
        logging.info("Step 4: Attempting Managed Identity authentication...")
        # Try Managed Identity
        try:
            logging.info("  - Creating DefaultAzureCredential...")
            credential = DefaultAzureCredential()
            logging.info("  - Getting token from Azure AD...")
            token = credential.get_token("https://database.windows.net/.default")
            logging.info(f"  - Token obtained (length: {len(token.token)})")
            
            token_bytes = token.token.encode('utf-16-le')
            token_struct = struct.pack(f'<I{len(token_bytes)}s', len(token_bytes), token_bytes)
            logging.info(f"  - Token struct created (length: {len(token_struct)})")
            
            # Remove Authentication= if present, we'll use token
            conn_str_clean = re.sub(r'Authentication=[^;]+;?', '', conn_str)
            conn_str_clean = conn_str_clean.rstrip(';')
            logging.info(f"  - Connection string cleaned (masked): {mask_connection_string(conn_str_clean)}")
            
            logging.info("  - Attempting pyodbc.connect with token...")
            conn = pyodbc.connect(conn_str_clean, attrs_before={1256: token_struct}, timeout=30)
            logging.info("✅ Connected using Managed Identity")
            logging.info("=" * 60)
            return conn
        except Exception as e:
            logging.warning(f"⚠️ Managed Identity failed: {type(e).__name__}: {e}")
            logging.warning(f"Managed Identity traceback: {traceback.format_exc()}")
            logging.info("  - Falling back to connection string authentication...")
    
    # Fallback to connection string authentication
    logging.info("Step 5: Attempting connection string authentication...")
    try:
        logging.info(f"  - Connection string (masked): {mask_connection_string(conn_str)}")
        logging.info("  - Attempting pyodbc.connect...")
        conn = pyodbc.connect(conn_str, timeout=30)
        logging.info("✅ Connected using connection string")
        logging.info("=" * 60)
        return conn
    except Exception as e:
        logging.error(f"❌ Connection failed: {type(e).__name__}: {e}")
        logging.error(f"Connection error traceback: {traceback.format_exc()}")
        logging.error("=" * 60)
        raise

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Azure Function to save user data to SQL database."""
    logging.info("=" * 60)
    logging.info("POST /api/save - Function invoked")
    logging.info("=" * 60)
    
    try:
        logging.info("Step 1: Getting request JSON data...")
        # Get JSON data
        data = req.get_json()
        logging.info(f"Raw request data type: {type(data)}")
        
        if not data:
            logging.error("❌ No JSON data received")
            logging.error("Request body: " + str(req.get_body()))
            return func.HttpResponse(
                json.dumps({'error': 'No data received'}),
                status_code=400,
                mimetype='application/json'
            )
        
        logging.info(f"✅ Received JSON data: {json.dumps({k: v for k, v in data.items() if k != 'password'}, indent=2)}")
        
        logging.info("Step 2: Extracting fields...")
        # Extract fields
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        fabric_experience = data.get('fabricExperience', '').strip()
        description = data.get('description', '').strip()
        can_contact = data.get('canContact', '').strip()
        
        logging.info(f"Extracted - Name: {name}, Email: {email}, Experience: {fabric_experience}, Description: {description}, Contact: {can_contact}")
        
        logging.info("Step 3: Validating required fields...")
        # Validate required fields
        if not all([name, email, fabric_experience, description, can_contact]):
            missing = [field for field, value in [
                ('name', name), ('email', email), ('fabricExperience', fabric_experience),
                ('description', description), ('canContact', can_contact)
            ] if not value]
            logging.error(f"❌ Missing required fields: {missing}")
            return func.HttpResponse(
                json.dumps({'error': 'All fields are required', 'missing': missing}),
                status_code=400,
                mimetype='application/json'
            )
        logging.info("✅ All fields validated")
        
        logging.info("Step 4: Getting database connection...")
        # Connect to database
        conn_str_env = os.environ.get('SQL_CONNECTION_STRING', '')
        logging.info(f"SQL_CONNECTION_STRING exists: {bool(conn_str_env)}")
        if conn_str_env:
            logging.info(f"Connection string length: {len(conn_str_env)}")
            logging.info(f"Connection string (masked): {mask_connection_string(conn_str_env)}")
        else:
            logging.error("❌ SQL_CONNECTION_STRING environment variable is NOT set!")
        
        conn = get_db_connection()
        logging.info("✅ Database connection established")
        cursor = conn.cursor()
        logging.info("✅ Database cursor created")
        
        logging.info("Step 5: Checking/creating GameUsers table...")
        # Check if table exists, create if not
        try:
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
            logging.info("✅ Table check/create query executed")
            conn.commit()
            logging.info("✅ Table check/create committed")
        except Exception as table_error:
            logging.error(f"❌ Error checking/creating table: {table_error}")
            logging.error(f"Table error traceback: {traceback.format_exc()}")
            raise
        
        logging.info("Step 6: Inserting user data...")
        # Insert user data
        try:
            logging.info(f"Preparing INSERT with values: Name={name}, Email={email}, Experience={fabric_experience}, Description={description[:50]}..., Contact={can_contact}")
            cursor.execute("""
                INSERT INTO [dbo].[GameUsers] (Name, Email, FabricExperience, Description, CanContact)
                VALUES (?, ?, ?, ?, ?)
            """, name, email, fabric_experience, description, can_contact)
            logging.info("✅ INSERT query executed")
            conn.commit()
            logging.info("✅ INSERT committed")
        except Exception as insert_error:
            logging.error(f"❌ Error inserting data: {insert_error}")
            logging.error(f"Insert error traceback: {traceback.format_exc()}")
            conn.rollback()
            logging.info("Transaction rolled back")
            raise
        
        logging.info("Step 7: Closing database connections...")
        cursor.close()
        logging.info("✅ Cursor closed")
        conn.close()
        logging.info("✅ Connection closed")
        
        logging.info(f"✅ Successfully saved user: {name} ({email})")
        logging.info("=" * 60)
        
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
        error_type = type(e).__name__
        
        logging.error("=" * 60)
        logging.error("❌ ERROR OCCURRED")
        logging.error("=" * 60)
        logging.error(f"Error Type: {error_type}")
        logging.error(f"Error Message: {error_msg}")
        logging.error(f"Full Traceback:")
        logging.error(error_traceback)
        logging.error("=" * 60)
        
        # Log environment variables (masked)
        logging.info("Environment check:")
        conn_str_check = os.environ.get('SQL_CONNECTION_STRING', '')
        logging.info(f"SQL_CONNECTION_STRING set: {bool(conn_str_check)}")
        if conn_str_check:
            logging.info(f"Connection string (masked): {mask_connection_string(conn_str_check)}")
        
        # Ensure we always return a valid response
        try:
            error_response = {
                'success': False,
                'error': 'Failed to save data to database',
                'error_type': error_type,
                'details': error_msg,
                'traceback': error_traceback if logging.getLogger().level <= logging.DEBUG else None
            }
            logging.info(f"Returning error response: {json.dumps(error_response, indent=2)}")
            return func.HttpResponse(
                json.dumps(error_response),
                status_code=500,
                mimetype='application/json'
            )
        except Exception as response_error:
            # If JSON encoding fails, return plain text
            logging.error(f"Failed to create JSON error response: {response_error}")
            logging.error(f"Response error traceback: {traceback.format_exc()}")
            return func.HttpResponse(
                f"Error: {error_msg}",
                status_code=500,
                mimetype='text/plain'
            )
