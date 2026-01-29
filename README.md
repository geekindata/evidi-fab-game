# FabFeb Game

Quiz game with user registration form, built with Flask, HTML, CSS, and JavaScript.

## Quick Start

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Setup Database User (Azure AD)

1. Copy `create_azuread_user.sql.example` to `create_azuread_user.sql`
2. Replace `YOUR_EMAIL@domain.com` with your Azure AD email
3. Run the SQL in Fabric SQL Query Editor

Or get your email and run directly:
```powershell
az account show --query user.name -o tsv
```

Then run in SQL:
```sql
CREATE USER [your.email@domain.com] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [your.email@domain.com];
ALTER ROLE db_datawriter ADD MEMBER [your.email@domain.com];
```

### 3. Create Database Table

Run `create_table.sql` in Fabric SQL Query Editor to create the GameUsers table.

### 4. Start Flask App

**Option A - Use startup script (recommended):**
```powershell
.\start_flask.ps1
```

**Option B - Manual:**
```powershell
# Copy start_flask.ps1.example to start_flask.ps1 and update with your connection string
# Or set manually:
$env:SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no;Authentication=ActiveDirectoryInteractive"
python app.py
```

### 5. Access the App

- Local: http://localhost:5000
- Network: Check Flask console for your network IP address

**Note:** On first database connection, a browser window will open for Azure AD authentication.

## Project Structure

```
.
├── app.py                      # Flask server with database connection
├── index.html                  # Main page with registration form
├── start_flask.ps1.example     # Template for startup script (copy and configure)
├── create_azuread_user.sql.example  # Template for Azure AD user SQL (copy and configure)
├── create_table.sql            # SQL to create GameUsers table
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/styles.css         # Styling
│   ├── js/game.js             # Game logic and form submission
│   ├── icons/                 # SVG icons
│   └── images/                # Images
└── README.md
```

## Features

- ✅ User registration form with 5 questions
- ✅ Azure AD authentication (Managed Identity or ActiveDirectoryInteractive)
- ✅ Data saved to Microsoft Fabric SQL Database
- ✅ Success/error messages
- ✅ Quiz game with icon guessing
- ✅ Prevents double-clicking on submit button

## Database Schema

The `GameUsers` table stores:
- Name
- Email
- FabricExperience
- Description
- CanContact
- CreatedAt (auto-generated)

## Troubleshooting

**Connection string not found:**
- Make sure you run `.\start_flask.ps1` or set `$env:SQL_CONNECTION_STRING` before starting Flask

**Authentication fails:**
- Ensure your Azure AD account is added to the database (run `create_azuread_user.sql`)
- Check that you're logged into Azure CLI: `az login`

**No logs visible:**
- Logs appear in the Flask console
- Check application logs in Azure App Service if deployed
