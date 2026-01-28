# Deploy Flask App to Azure App Service

## ✅ Yes, it works without Azure Functions!

Azure App Service runs Flask apps directly - no Functions needed.

## Deployment Steps

### 1. Create Azure App Service (Python)

```bash
# Create resource group
az group create --name rg-evidi-fab-game --location norwayeast

# Create App Service Plan
az appservice plan create \
  --name plan-evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --plan plan-evidi-fab-game \
  --runtime "PYTHON:3.11"
```

### 2. Enable Managed Identity

```bash
az webapp identity assign \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game
```

### 3. Get Managed Identity Object ID

```bash
az webapp identity show \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --query principalId -o tsv
```

### 4. Add Managed Identity to Database

Run this SQL in Fabric SQL Query Editor (replace `OBJECT_ID` with the principalId from step 3):

```sql
CREATE USER [evidi-fab-game] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game];
ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game];
```

### 5. Set Connection String (without credentials)

Replace `YOUR_SERVER` and `YOUR_DATABASE_NAME` with your actual values:

```bash
az webapp config appsettings set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --settings SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no"
```

**Important:** Do NOT include `Authentication=ActiveDirectoryInteractive` or `User ID`/`Password` - Managed Identity will be used automatically.

**Note:** For Azure App Service, use Managed Identity (no Authentication parameter). The code will automatically use Managed Identity when deployed.

### 6. Configure Startup Command

```bash
az webapp config set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --startup-file "gunicorn --bind 0.0.0.0:8000 --timeout 600 --workers 2 --threads 4 app:app"
```

### 7. Deploy Code

**Option A - Using Azure CLI:**
```bash
az webapp up \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --runtime "PYTHON:3.11"
```

**Option B - Using VS Code Azure Extension:**
1. Install "Azure App Service" extension
2. Right-click project → "Deploy to Web App"
3. Select your web app

**Option C - Using GitHub Actions:**
Create `.github/workflows/deploy.yml` (see below)

### 8. Install ODBC Driver

Azure App Service Linux needs ODBC Driver installed. Add to `startup.sh` or use a custom Docker image.

## GitHub Actions Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: evidi-fab-game
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

## Differences: Local vs Azure

| Feature | Local | Azure App Service |
|---------|-------|-------------------|
| Authentication | ActiveDirectoryInteractive (browser prompt) | Managed Identity (automatic) |
| Server | Flask dev server | Gunicorn (production) |
| Port | 5000 | 8000 (Azure sets PORT env var) |
| Connection String | Set manually | Set in App Settings |

## Verify Deployment

1. Go to: `https://evidi-fab-game.azurewebsites.net`
2. Submit the form
3. Check logs: Azure Portal → App Service → Log stream

## Troubleshooting

**Connection fails:**
- Check Managed Identity is enabled
- Verify Managed Identity is added to database
- Check connection string in App Settings

**App won't start:**
- Check startup command is set correctly
- Verify requirements.txt includes gunicorn
- Check logs in Azure Portal
