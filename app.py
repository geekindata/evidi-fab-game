from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # type: ignore
import pyodbc  # type: ignore
import os
import json
import logging
import re
import traceback
import socket
from azure.identity import DefaultAzureCredential  # type: ignore

# Configure logging to both console and file
import sys
from logging.handlers import RotatingFileHandler

# Create logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Remove existing handlers
logger.handlers = []

# Console handler (stdout - visible in terminal)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Also add stderr handler for Flask's default output
stderr_handler = logging.StreamHandler(sys.stderr)
stderr_handler.setLevel(logging.WARNING)  # Only warnings and errors to stderr
stderr_handler.setFormatter(console_formatter)
logger.addHandler(stderr_handler)

# File handler (UTF-8 encoding for Windows compatibility)
file_handler = RotatingFileHandler('flask_app.log', maxBytes=10485760, backupCount=5, encoding='utf-8')  # 10MB per file, 5 backups
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Also enable Flask's logger
logging.getLogger('werkzeug').setLevel(logging.INFO)
werkzeug_handler = RotatingFileHandler('flask_app.log', maxBytes=10485760, backupCount=5)
werkzeug_handler.setFormatter(file_formatter)
logging.getLogger('werkzeug').addHandler(werkzeug_handler)

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static',
            template_folder='.')
CORS(app)  # Allow frontend to call API

# Add request logging
@app.before_request
def log_request_info():
    msg = f"{request.method} {request.path} from {request.remote_addr}"
    print(f"\n>>> {msg}", flush=True)  # Print to console immediately
    logger.info(f"{request.method} {request.path}")
    if request.is_json:
        logger.info(f"   Content-Type: application/json")
    logger.info(f"   Remote Address: {request.remote_addr}")

# Add error handlers to catch all errors
@app.errorhandler(500)
def handle_500_error(e):
    safe_log_error("500 Internal Server Error!", e)
    return jsonify({
        'success': False,
        'error': str(e),
        'message': 'Internal server error'
    }), 500

@app.errorhandler(Exception)
def handle_exception(e):
    safe_log_error(f"Unhandled Exception: {type(e).__name__}", e)
    return jsonify({
        'success': False,
        'error': str(e),
        'message': 'An error occurred'
    }), 500

def mask_connection_string(conn_str: str) -> str:
    """Mask sensitive parts of connection string for logging"""
    masked = conn_str
    # Mask passwords
    masked = re.sub(r'Password=([^;]+)', 'Password=***', masked, flags=re.IGNORECASE)
    # Mask User ID if present
    masked = re.sub(r'User ID=([^;]+)', 'User ID=***', masked, flags=re.IGNORECASE)
    # Mask authentication tokens
    masked = re.sub(r'Authentication=([^;]+)', 'Authentication=***', masked, flags=re.IGNORECASE)
    return masked

def safe_log_error(message: str, exception: Exception = None):
    """Log error safely, ensuring traceback is captured"""
    try:
        logger.error("=" * 60)
        logger.error(f"ERROR: {message}")
        if exception:
            logger.error(f"Exception Type: {type(exception).__name__}")
            logger.error(f"Exception Message: {str(exception)}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")
        logger.error("=" * 60)
    except Exception as log_error:
        # If logging fails, at least print to stderr
        print(f"LOGGING ERROR: {log_error}", file=sys.stderr)
        print(f"ORIGINAL ERROR: {message}", file=sys.stderr)
        if exception:
            print(f"EXCEPTION: {exception}", file=sys.stderr)
            traceback.print_exc()

def normalize_connection_string_to_odbc(conn_str: str) -> str:
    """Normalize connection string to ODBC format"""
    # If already in ODBC format with Authentication=ActiveDirectoryInteractive, return as-is
    if re.search(r'Authentication\s*=\s*ActiveDirectoryInteractive', conn_str, re.IGNORECASE):
        logger.info("Connection string already in ODBC format with ActiveDirectoryInteractive")
        return conn_str
    
    # Convert Data Source= to Server=
    conn_str = re.sub(r'Data Source=', 'Server=', conn_str, flags=re.IGNORECASE)
    
    # Convert Initial Catalog= to Database= (remove curly braces if present)
    conn_str = re.sub(r'Initial Catalog=', 'Database=', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Database=\{([^}]+)\}', r'Database=\1', conn_str)  # Remove {} around database name
    
    # Convert Trust Server Certificate= to TrustServerCertificate=
    conn_str = re.sub(r'Trust Server Certificate=', 'TrustServerCertificate=', conn_str, flags=re.IGNORECASE)
    # Convert True/False to yes/no for TrustServerCertificate
    conn_str = re.sub(r'TrustServerCertificate=True', 'TrustServerCertificate=yes', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'TrustServerCertificate=False', 'TrustServerCertificate=no', conn_str, flags=re.IGNORECASE)
    
    # Convert Encrypt=True/False to Encrypt=yes/no
    conn_str = re.sub(r'Encrypt=True', 'Encrypt=yes', conn_str, flags=re.IGNORECASE)
    conn_str = re.sub(r'Encrypt=False', 'Encrypt=no', conn_str, flags=re.IGNORECASE)
    
    # Remove Multiple Active Result Sets (not needed for ODBC)
    conn_str = re.sub(r'Multiple Active Result Sets=[^;]+;?', '', conn_str, flags=re.IGNORECASE)
    
    logger.info("Normalized connection string to ODBC format")
    return conn_str

def add_driver_to_connection_string(conn_str: str) -> str:
    """Add ODBC driver to connection string if not present"""
    # Check if Driver is already specified
    if re.search(r'Driver\s*=', conn_str, re.IGNORECASE):
        logger.info("Driver already specified in connection string")
        return conn_str
    
    # Try to find available ODBC drivers
    available_drivers = [driver for driver in pyodbc.drivers() if 'SQL Server' in driver]
    
    if available_drivers:
        # Prefer ODBC Driver 17 or 18, fallback to first available
        preferred_drivers = ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server', 
                           'ODBC Driver 13 for SQL Server']
        driver = None
        for pref in preferred_drivers:
            if pref in available_drivers:
                driver = pref
                break
        if not driver:
            driver = available_drivers[0]
        
        logger.info(f"Adding driver to connection string: {driver}")
        # Add driver at the beginning
        if not conn_str.strip().startswith('Driver='):
            conn_str = f"Driver={{{driver}}};{conn_str}"
        return conn_str
    else:
        logger.warning("No SQL Server ODBC drivers found! Available drivers:")
        for drv in pyodbc.drivers():
            logger.warning(f"  - {drv}")
        raise Exception("No SQL Server ODBC driver found. Please install 'ODBC Driver 17 for SQL Server' or 'ODBC Driver 18 for SQL Server'")

# Database connection with ActiveDirectoryInteractive support
def get_db():
    print(">>> Attempting database connection...", flush=True)
    logger.info("=" * 60)
    logger.info("Attempting database connection...")
    
    conn_str = os.environ.get('SQL_CONNECTION_STRING', '')
    if not conn_str:
        print(">>> ERROR: SQL_CONNECTION_STRING not set!", flush=True)
        logger.error("SQL_CONNECTION_STRING environment variable is not set!")
        raise Exception('SQL_CONNECTION_STRING not set. Set it with: $env:SQL_CONNECTION_STRING="your-connection-string"')
    
    print(f">>> Raw connection string (first 100 chars): {conn_str[:100]}...", flush=True)
    print(f">>> Connection string found (masked): {mask_connection_string(conn_str)}", flush=True)
    logger.info(f"Connection string found (masked): {mask_connection_string(conn_str)}")
    
    # Check if already has ActiveDirectoryInteractive BEFORE normalization
    has_active_directory = re.search(r'Authentication\s*=\s*ActiveDirectoryInteractive', conn_str, re.IGNORECASE)
    print(f">>> Has ActiveDirectoryInteractive: {bool(has_active_directory)}", flush=True)
    
    # Normalize connection string to ODBC format
    conn_str = normalize_connection_string_to_odbc(conn_str)
    
    # Add ODBC driver if not present
    conn_str = add_driver_to_connection_string(conn_str)
    
    # Try Managed Identity first (works in Azure App Service and locally with Azure CLI)
    # This is preferred for Azure deployment
    if not re.search(r'User ID=|Password=', conn_str, re.IGNORECASE):
        print(">>> Attempting Managed Identity authentication...", flush=True)
        logger.info("Attempting Managed Identity / Azure AD authentication...")
        try:
            credential = DefaultAzureCredential()
            print(">>> Requesting Azure AD token...", flush=True)
            logger.info("DefaultAzureCredential created, requesting token...")
            token = credential.get_token("https://database.windows.net/.default")
            print(f">>> Token obtained (expires: {token.expires_on})", flush=True)
            logger.info(f"Token obtained successfully (expires: {token.expires_on})")
            
            # Remove authentication parameters for token-based connection
            clean_conn_str = re.sub(r'Authentication=[^;]+;?', '', conn_str, flags=re.IGNORECASE)
            clean_conn_str = re.sub(r'User ID=[^;]+;?', '', clean_conn_str, flags=re.IGNORECASE)
            clean_conn_str = re.sub(r'Password=[^;]+;?', '', clean_conn_str, flags=re.IGNORECASE)
            clean_conn_str = clean_conn_str.strip().rstrip(';')
            
            # Connect with token (ODBC Driver 18)
            token_bytes = bytearray(token.token.encode('utf-16-le'))
            print(">>> Connecting with Managed Identity token...", flush=True)
            conn = pyodbc.connect(clean_conn_str, attrs_before={1256: token_bytes})
            print(">>> SUCCESS: Database connected with Managed Identity!", flush=True)
            logger.info("Database connection successful using Managed Identity!")
            return conn
        except Exception as mi_error:
            print(f">>> Managed Identity failed: {str(mi_error)}", flush=True)
            logger.warning(f"Managed Identity failed: {str(mi_error)}")
            # Continue to try other methods
    
    # Try ActiveDirectoryInteractive (for local development with browser prompt)
    if re.search(r'Authentication\s*=\s*ActiveDirectoryInteractive', conn_str, re.IGNORECASE):
        print(">>> Using ActiveDirectoryInteractive - will prompt for Azure AD login", flush=True)
        logger.info("Using ActiveDirectoryInteractive authentication (will prompt for Azure AD login)")
        try:
            print(">>> Connecting to database...", flush=True)
            conn = pyodbc.connect(conn_str)
            print(">>> SUCCESS: Database connected!", flush=True)
            logger.info("Database connection successful using ActiveDirectoryInteractive!")
            return conn
        except Exception as conn_error:
            print(f">>> ERROR: Connection failed: {str(conn_error)}", flush=True)
            safe_log_error(f"ActiveDirectoryInteractive authentication failed: {str(conn_error)}", conn_error)
            raise
    
    # Fallback: Try connection string as-is (for SQL Auth with User ID/Password)
    print(">>> Attempting connection with connection string authentication...", flush=True)
    logger.info("Attempting connection with connection string authentication...")
    try:
        conn = pyodbc.connect(conn_str)
        print(">>> SUCCESS: Database connected!", flush=True)
        logger.info("Database connection successful!")
        return conn
    except Exception as conn_error:
        print(f">>> ERROR: Connection failed: {str(conn_error)}", flush=True)
        safe_log_error(f"Connection failed: {str(conn_error)}", conn_error)
        raise

# Serve main page
@app.route('/')
def index():
    logger.info("🌐 GET / - Serving index page")
    return render_template('index.html')

# Test endpoint to verify logging works
@app.route('/api/test', methods=['GET'])
def test_logging():
    print("\n" + "=" * 60, file=sys.stderr)
    print("🧪 TEST ENDPOINT CALLED - Logging is working!", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)
    logger.info("🧪 TEST: Logging endpoint called successfully")
    return jsonify({'success': True, 'message': 'Logging is working! Check your Flask console.'})

# API endpoint to save user data
@app.route('/api/save', methods=['POST'])
def save_user():
    # Print immediately to ensure we see output (stdout is more visible)
    print("\n" + "=" * 60, flush=True)
    print(">>> POST /api/save - Received request", flush=True)
    print("=" * 60, flush=True)
    
    logger.info("=" * 60)
    logger.info("POST /api/save - Received request")
    
    try:
        # Log request data
        data = request.json
        if not data:
            logger.error("❌ No JSON data received in request")
            return jsonify({'error': 'No data received'}), 400
        
        print(f">>> Received data: {json.dumps({k: v for k, v in data.items() if k != 'password'}, indent=2)}", flush=True)
        logger.info(f"Received data: {json.dumps({k: v for k, v in data.items() if k != 'password'}, indent=2)}")
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        fabric_experience = data.get('fabricExperience', '').strip()
        description = data.get('description', '').strip()
        can_contact = data.get('canContact', '').strip()
        
        print(f">>> Parsed: Name={name}, Email={email}", flush=True)
        logger.info(f"Parsed fields:")
        logger.info(f"   Name: {name}")
        logger.info(f"   Email: {email}")
        logger.info(f"   Fabric Experience: {fabric_experience}")
        logger.info(f"   Description: {description}")
        logger.info(f"   Can Contact: {can_contact}")
        
        if not all([name, email, fabric_experience, description, can_contact]):
            missing = [field for field, value in [
                ('name', name), ('email', email), ('fabricExperience', fabric_experience),
                ('description', description), ('canContact', can_contact)
            ] if not value]
            print(f">>> ERROR: Missing fields: {', '.join(missing)}", flush=True)
            logger.error(f"Missing required fields: {', '.join(missing)}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        print(">>> Getting database connection...", flush=True)
        logger.info("Getting database connection...")
        conn = get_db()
        cursor = conn.cursor()
        print(">>> Database cursor created", flush=True)
        logger.info("Database cursor created")
        
        # Create table if needed
        print(">>> Checking/creating GameUsers table...", flush=True)
        logger.info("Checking if GameUsers table exists...")
        try:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GameUsers')
                CREATE TABLE GameUsers (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(100) NOT NULL,
                    Email NVARCHAR(255) NOT NULL,
                    FabricExperience NVARCHAR(200) NOT NULL,
                    Description NVARCHAR(500) NOT NULL,
                    CanContact NVARCHAR(10) NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
                )
            """)
            print(">>> Table check/create completed", flush=True)
            logger.info("Table check/create completed")
        except Exception as table_error:
            print(f">>> ERROR creating table: {str(table_error)}", flush=True)
            safe_log_error(f"Error creating/checking table: {str(table_error)}", table_error)
            raise
        
        # Insert data
        print(">>> Inserting user data...", flush=True)
        logger.info("Inserting user data...")
        try:
            cursor.execute("""
                INSERT INTO GameUsers (Name, Email, FabricExperience, Description, CanContact) 
                VALUES (?, ?, ?, ?, ?)
            """, name, email, fabric_experience, description, can_contact)
            print(">>> INSERT executed, committing...", flush=True)
            logger.info("INSERT statement executed")
            
            conn.commit()
            print(">>> SUCCESS: Data saved to database!", flush=True)
            logger.info("Transaction committed")
            
            # Try to get the inserted ID
            try:
                cursor.execute("SELECT SCOPE_IDENTITY()")
                row = cursor.fetchone()
                inserted_id = row[0] if row else None
                print(f">>> Inserted record ID: {inserted_id}", flush=True)
                logger.info(f"Inserted record ID: {inserted_id}")
            except Exception as id_error:
                logger.warning(f"Could not retrieve inserted ID: {str(id_error)}")
                inserted_id = None
            
            cursor.close()
            conn.close()
            logger.info("Database connection closed")
            
            print("=" * 60, flush=True)
            print(">>> SUCCESS: Data saved successfully!", flush=True)
            print("=" * 60 + "\n", flush=True)
            logger.info("=" * 60)
            logger.info("SUCCESS: Data saved successfully!")
            logger.info("=" * 60)
            
            return jsonify({
                'success': True, 
                'message': 'Data saved successfully',
                'id': inserted_id
            })
        except Exception as insert_error:
            print(f">>> ERROR during INSERT: {str(insert_error)}", flush=True)
            safe_log_error(f"Error during INSERT: {str(insert_error)}", insert_error)
            if conn:
                try:
                    conn.rollback()
                    logger.info("Transaction rolled back")
                except:
                    pass
            raise
            
    except Exception as e:
        print(f"\n>>> ERROR in save_user: {str(e)}", flush=True)
        print("=" * 60 + "\n", flush=True)
        safe_log_error(f"ERROR in save_user: {str(e)}", e)
        
        # Return detailed error message
        error_msg = str(e)
        if 'SQL_CONNECTION_STRING' in error_msg:
            error_msg = 'Database connection string not configured. Please set SQL_CONNECTION_STRING environment variable.'
        elif 'login failed' in error_msg.lower() or 'authentication' in error_msg.lower():
            error_msg = 'Database authentication failed. Please check your connection string and database permissions.'
        elif 'permission' in error_msg.lower() or 'denied' in error_msg.lower():
            error_msg = 'Database permission denied. Please ensure your account has db_datareader and db_datawriter permissions.'
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'message': 'Failed to save data to database',
            'details': str(e) if app.debug else None
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info("=" * 60)
    logger.info("Starting Flask application...")
    
    # Get local IP address
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except:
        local_ip = "localhost"
    
    logger.info(f"Server listening on all interfaces (0.0.0.0:{port})")
    logger.info(f"Access via:")
    logger.info(f"  - Local:   http://localhost:{port}")
    logger.info(f"  - Network: http://{local_ip}:{port}")
    logger.info(f"Debug mode: {'ON' if app.debug else 'OFF'}")
    
    # Check for connection string
    conn_str = os.environ.get('SQL_CONNECTION_STRING', '')
    if conn_str:
        logger.info(f"SQL_CONNECTION_STRING is set (masked): {mask_connection_string(conn_str)}")
    else:
        logger.warning("SQL_CONNECTION_STRING is NOT set - database operations will fail!")
        logger.warning("   Set it with: $env:SQL_CONNECTION_STRING='your-connection-string'")
    
    logger.info("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=True)
