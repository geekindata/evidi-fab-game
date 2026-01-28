# Local Testing Guide

## Prerequisites

1. **Python 3.8+** installed
   ```powershell
   python --version
   ```

2. **ODBC Driver 18 for SQL Server** installed
   - Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - Or install via: `winget install Microsoft.ODBCDriver.18`

3. **Azure CLI** installed and logged in
   ```powershell
   az --version
   az login
   ```

4. **Microsoft Fabric SQL Database** set up
   - You need a Fabric workspace with a SQL endpoint
   - Database should be created and accessible

## Step-by-Step Testing Instructions

### 1. Install Python Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Set Up Database

#### A. Create the GameUsers Table
Run `create_table.sql` in Fabric SQL Query Editor to create the table.

#### B. Set Up Database User (if using Azure AD authentication)
Run `create_azuread_user.sql.example` (copy to `create_azuread_user.sql` and update with your email) in Fabric SQL Query Editor.

Or run directly:
```powershell
# Get your Azure AD email
az account show --query user.name -o tsv
```

Then in SQL Query Editor:
```sql
CREATE USER [your.email@domain.com] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [your.email@domain.com];
ALTER ROLE db_datawriter ADD MEMBER [your.email@domain.com];
```

### 3. Get Your Connection String

You need your Fabric SQL connection string. You can find it in:
- Azure Portal → Your Fabric Workspace → SQL Analytics Endpoint → Connection strings

Format:
```
Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no;Authentication=ActiveDirectoryInteractive
```

### 4. Start the Flask App

#### Option A: Using PowerShell Script (Recommended)

1. Copy the example script:
   ```powershell
   Copy-Item start_flask.ps1.example start_flask.ps1
   ```

2. Edit `start_flask.ps1` and replace `YOUR_SERVER` and `YOUR_DATABASE_NAME` with your actual values.

3. Run the script:
   ```powershell
   .\start_flask.ps1
   ```

#### Option B: Manual Setup

```powershell
# Set connection string environment variable
$env:SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no;Authentication=ActiveDirectoryInteractive"

# Start Flask
python app.py
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

**Note:** On first database connection, a browser window may open for Azure AD authentication.

## Testing the Email Check Feature

### Test Scenario 1: New User (Email Not Found)

1. Open http://localhost:5000
2. You should see the email entry form
3. Enter an email that doesn't exist in the database (e.g., `test@example.com`)
4. Click "🎮 Let's Play!"
5. **Expected:** You should be redirected to the registration form with the email pre-filled
6. Fill out the registration form
7. Submit the form
8. **Expected:** Game should start

### Test Scenario 2: Returning User (Email Found)

1. After completing Test Scenario 1, click "Play Again" at the end of the game
2. You should return to the email entry screen
3. Enter the same email you used in Test Scenario 1
4. Click "🎮 Let's Play!"
5. **Expected:** You should see "✅ Welcome back! Starting game..." and go directly to the game (skipping registration)

### Test Scenario 3: Invalid Email

1. On the email entry screen, enter an invalid email format (e.g., `notanemail`)
2. Click "🎮 Let's Play!"
3. **Expected:** HTML5 validation should prevent submission or show an error

### Test Scenario 4: Empty Email

1. Leave the email field empty
2. Click "🎮 Let's Play!"
3. **Expected:** Should show error message "Please enter your email address"

### Test Scenario 5: Database Connection Error

1. Stop your Flask app
2. Set an invalid connection string:
   ```powershell
   $env:SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=invalid.server.com,1433;Database=InvalidDB;Encrypt=yes;TrustServerCertificate=no;Authentication=ActiveDirectoryInteractive"
   ```
3. Start Flask app: `python app.py`
4. Try to check an email
5. **Expected:** Should show error message "⚠️ Could not check your email. Please try again."

## Troubleshooting

### Issue: "ODBC Driver 18 for SQL Server" not found
**Solution:** Install ODBC Driver 18 from Microsoft's website or use winget:
```powershell
winget install Microsoft.ODBCDriver.18
```

### Issue: Authentication fails
**Solution:** 
- Make sure you're logged into Azure CLI: `az login`
- Verify your Azure AD account has access to the database
- Check that you've run the `create_azuread_user.sql` script

### Issue: Connection string error
**Solution:**
- Verify your connection string format
- Check that your Fabric SQL endpoint is accessible
- Ensure the database name is correct

### Issue: Table doesn't exist
**Solution:**
- Run `create_table.sql` in Fabric SQL Query Editor
- Verify the table was created successfully

### Issue: Port 5000 already in use
**Solution:**
- Change the port in `app.py`:
  ```python
  port = int(os.environ.get('PORT', 5001))  # Change to 5001 or another port
  ```
- Or stop the process using port 5000

## Checking Logs

The Flask app logs to the console. Watch for:
- Connection status messages
- API request logs
- Error messages

## Quick Test Checklist

- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Database table created (`create_table.sql`)
- [ ] Database user configured (if using Azure AD)
- [ ] Connection string set correctly
- [ ] Flask app starts without errors
- [ ] Can access http://localhost:5000
- [ ] Email check works for new users (shows registration form)
- [ ] Email check works for returning users (goes directly to game)
- [ ] Registration form saves data successfully
- [ ] Game starts after registration
- [ ] "Play Again" returns to email entry screen
