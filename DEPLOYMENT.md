# Deployment Guide for Azure Static Web Apps

## Quick Setup Steps

### 1. Add SQL Connection String to Azure

1. Go to your Azure Function App (created automatically with Static Web App)
2. Navigate to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add:
   - **Name**: `SQL_CONNECTION_STRING`
   - **Value**: Your connection string from Fabric SQL Database
5. Click **Save**

### 2. Connection String Format

Your connection string should look like:
```
Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-database;Persist Security Info=False;User ID=your-username;Password=your-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### 3. Database Table

The Azure Function will automatically create the table on first run. If you prefer to create it manually:

```sql
CREATE TABLE GameUsers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Role NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
)
```

### 4. Deploy to Azure Static Web Apps

**Option A: GitHub Actions (Recommended)**
1. Push your code to GitHub
2. Create Azure Static Web App in Azure Portal
3. Connect to your GitHub repository
4. Azure will automatically deploy on every push

**Option B: Azure CLI**
```bash
az staticwebapp create \
  --name evidi-fab-game \
  --resource-group your-resource-group \
  --location "East US 2" \
  --sku Free

az staticwebapp appsettings set \
  --name evidi-fab-game \
  --resource-group your-resource-group \
  --setting-names SQL_CONNECTION_STRING="your-connection-string"
```

## Testing Locally

1. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. Copy the example settings file:
   ```bash
   copy local.settings.json.example local.settings.json
   ```

3. Edit `local.settings.json` and add your SQL connection string

4. Start the Functions runtime:
   ```bash
   func start
   ```

5. Open `index.html` in your browser

## Troubleshooting

### Function Not Found (404)
- Ensure the `api/` folder is in the root of your repository
- Check that `function.json` exists in `api/SaveUserData/`

### Connection String Error
- Verify the connection string is correct
- Check that your SQL Database firewall allows Azure services
- Ensure the database exists and is accessible

### CORS Issues
- Azure Static Web Apps handle CORS automatically
- If testing locally, you may need to configure CORS in `host.json`

## Security Notes

- Never commit `local.settings.json` to Git (it's in `.gitignore`)
- Use Azure Key Vault for production connection strings
- Enable HTTPS only in Azure Static Web App settings
- Consider adding rate limiting to prevent abuse
