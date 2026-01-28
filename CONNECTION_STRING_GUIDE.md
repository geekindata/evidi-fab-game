# SQL Connection String Guide for Azure Static Web Apps

## ✅ Recommended: Managed Identity (No Credentials)

**Format:**
```
Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no
```

**Example:**
```
Driver={ODBC Driver 18 for SQL Server};Server=p2gnhr3dygrenigvwm3xdtyqxi-6ib77xdge2vejmpy73gdwddani.database.fabric.microsoft.com,1433;Database=FabFeb-c6054871-25cf-4914-a1d1-4017cc61d71d;Encrypt=yes;TrustServerCertificate=no
```

**What to do:**
1. Enable Managed Identity on your Static Web App:
   ```bash
   az staticwebapp identity assign \
     --name evidi-fab-game-dev \
     --resource-group YOUR_RESOURCE_GROUP
   ```

2. Add Managed Identity to database:
   ```sql
   -- Get the Object ID from Azure Portal or:
   -- az staticwebapp identity show --name evidi-fab-game-dev --resource-group YOUR_RESOURCE_GROUP --query principalId
   
   CREATE USER [evidi-fab-game-dev] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game-dev];
   ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game-dev];
   ```

3. Set connection string in Azure Portal:
   - Static Web App → Configuration → Application settings
   - Add: `SQL_CONNECTION_STRING` = (connection string above, NO credentials)

## ⚠️ Alternative: SQL Authentication (Not Recommended)

Only use if Managed Identity is not available:

**Format:**
```
Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;User ID=YOUR_USERNAME;Password=YOUR_PASSWORD;Encrypt=yes;TrustServerCertificate=no
```

**Security Warning:** This stores credentials in Azure. Use Managed Identity instead!

## 🔍 How It Works

The Azure Function (`api/save_user/__init__.py`) will:

1. **First try Managed Identity** (if no User ID/Password in connection string)
   - Uses `DefaultAzureCredential()` to get token automatically
   - No credentials needed!

2. **Fallback to SQL Auth** (if User ID/Password present)
   - Uses credentials from connection string
   - Less secure, but works if Managed Identity isn't set up

## 📋 Steps to Set Up

### Step 1: Enable Managed Identity
```bash
az staticwebapp identity assign \
  --name evidi-fab-game-dev \
  --resource-group YOUR_RESOURCE_GROUP
```

### Step 2: Get Object ID
```bash
az staticwebapp identity show \
  --name evidi-fab-game-dev \
  --resource-group YOUR_RESOURCE_GROUP \
  --query principalId -o tsv
```

### Step 3: Add to Database
Run in Fabric SQL Query Editor:
```sql
CREATE USER [evidi-fab-game-dev] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game-dev];
ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game-dev];
```

### Step 4: Set Connection String
Azure Portal → Static Web App → Configuration → Application settings:

**Name:** `SQL_CONNECTION_STRING`  
**Value:** 
```
Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no
```

**Important:** Do NOT include `User ID` or `Password` - Managed Identity handles authentication!

## ✅ Verification

After setup, test the API:
```bash
curl -X POST https://YOUR_APP.azurestaticapps.net/api/save \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","fabricExperience":"New","description":"Testing","canContact":"Yes"}'
```

Check logs in Azure Portal → Static Web App → Functions → save_user → Monitor

## 🚫 What NOT to Include

- ❌ `Authentication=ActiveDirectoryInteractive` (only for local dev)
- ❌ `User ID` and `Password` (if using Managed Identity)
- ❌ `TrustServerCertificate=yes` (security risk)

## ✅ What to Include

- ✅ `Driver={ODBC Driver 18 for SQL Server}` (or let code add it)
- ✅ `Server=...` (your Fabric SQL server)
- ✅ `Database=...` (your database name)
- ✅ `Encrypt=yes` (required)
- ✅ `TrustServerCertificate=no` (security best practice)
