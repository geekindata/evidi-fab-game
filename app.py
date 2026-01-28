from flask import Flask, request, jsonify, send_from_directory
import pyodbc  # type: ignore
import os
import logging
import re
import traceback
import struct
from azure.identity import DefaultAzureCredential  # type: ignore

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def normalize_connection_string_to_odbc(conn_str: str) -> str:
    """Convert ADO.NET format to ODBC format."""
    conn_str = re.sub(r'Data Source=', 'Server=', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Initial Catalog=', 'Database=', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Encrypt=True', 'Encrypt=yes', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Encrypt=False', 'Encrypt=no', conn_str, flags=re.IGNORECASE)
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
        logging.error("SQL_CONNECTION_STRING environment variable is not set")
        raise ValueError("SQL_CONNECTION_STRING environment variable is not set")
    
    # Normalize connection string format
    conn_str = normalize_connection_string_to_odbc(conn_str)
    conn_str = add_driver_to_connection_string(conn_str)
    
    # Check if using Managed Identity (no User ID/Password in connection string)
    has_credentials = 'User ID=' in conn_str or 'Password=' in conn_str
    has_auth = 'Authentication=' in conn_str
    
    # In Azure App Service, use Managed Identity
    if not has_credentials and not has_auth:
        try:
            credential = DefaultAzureCredential()
            token = credential.get_token("https://database.windows.net/.default")
            token_bytes = token.token.encode('utf-16-le')
            token_struct = struct.pack(f'<I{len(token_bytes)}s', len(token_bytes), token_bytes)
            
            # Remove Authentication= if present, we'll use token
            conn_str_clean = re.sub(r'Authentication=[^;]+;?', '', conn_str)
            conn_str_clean = conn_str_clean.rstrip(';')
            
            conn = pyodbc.connect(conn_str_clean, attrs_before={1256: token_struct}, timeout=30)
            logging.info("Connected using Managed Identity")
            return conn
        except Exception as e:
            logging.warning(f"Managed Identity failed: {type(e).__name__}: {e}")
            logging.info("Falling back to connection string authentication...")
    
    # Fallback to connection string authentication
    try:
        conn = pyodbc.connect(conn_str, timeout=30)
        logging.info("Connected using connection string")
        return conn
    except Exception as e:
        logging.error(f"Connection failed: {type(e).__name__}: {e}")
        logging.error(f"Connection error traceback: {traceback.format_exc()}")
        raise

@app.route('/')
def index():
    """Serve the main HTML page."""
    return send_from_directory('.', 'index.html')

@app.route('/api/check-email', methods=['POST'])
def check_email():
    """Check if email exists in database."""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT Email FROM [dbo].[GameUsers] WHERE Email = ?
            """, email)
            result = cursor.fetchone()
            
            exists = result is not None
            
            return jsonify({
                'exists': exists,
                'email': email
            }), 200
            
        except Exception as query_error:
            logging.error(f"Error checking email: {query_error}")
            logging.error(f"Query error traceback: {traceback.format_exc()}")
            return jsonify({
                'error': 'Failed to check email',
                'details': str(query_error)
            }), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        
        logging.error(f"Error checking email: {error_type}: {error_msg}")
        logging.error(f"Error traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'Failed to check email',
            'error_type': error_type,
            'details': error_msg
        }), 500

@app.route('/api/save', methods=['POST'])
def save_user():
    """Save user data to SQL database."""
    try:
        data = request.get_json()
        
        if not data:
            logging.error("No JSON data received")
            return jsonify({'error': 'No data received'}), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        fabric_experience = data.get('fabricExperience', '').strip()
        description = data.get('description', '').strip()
        can_contact = data.get('canContact', '').strip()
        
        if not all([name, email, fabric_experience, description, can_contact]):
            missing = [field for field, value in [
                ('name', name), ('email', email), ('fabricExperience', fabric_experience),
                ('description', description), ('canContact', can_contact)
            ] if not value]
            logging.error(f"Missing required fields: {missing}")
            return jsonify({'error': 'All fields are required', 'missing': missing}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
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
            conn.commit()
        except Exception as table_error:
            logging.error(f"Error checking/creating table: {table_error}")
            logging.error(f"Table error traceback: {traceback.format_exc()}")
            raise
        
        try:
            cursor.execute("""
                INSERT INTO [dbo].[GameUsers] (Name, Email, FabricExperience, Description, CanContact)
                VALUES (?, ?, ?, ?, ?)
            """, name, email, fabric_experience, description, can_contact)
            conn.commit()
        except Exception as insert_error:
            logging.error(f"Error inserting data: {insert_error}")
            logging.error(f"Insert error traceback: {traceback.format_exc()}")
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
        
        logging.info(f"Successfully saved user: {name} ({email})")
        
        return jsonify({
            'success': True,
            'message': 'Data saved successfully!'
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        
        logging.error(f"Error saving user data: {error_type}: {error_msg}")
        logging.error(f"Error traceback: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': 'Failed to save data to database',
            'error_type': error_type,
            'details': error_msg
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logging.info(f"Starting Flask application on http://0.0.0.0:{port}")
    
    if not os.environ.get('SQL_CONNECTION_STRING'):
        logging.warning("SQL_CONNECTION_STRING is not set - database operations will fail!")
    
    app.run(host='0.0.0.0', port=port, debug=False)
