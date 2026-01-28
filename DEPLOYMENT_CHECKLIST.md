# 🚀 Deployment Checklist

## ✅ Pre-Deployment Checklist

### Code Ready
- [x] All sensitive files excluded from git (`.gitignore` configured)
- [x] No hardcoded credentials in code
- [x] Connection string reads from environment variables
- [x] GitHub Actions workflow created (`.github/workflows/deploy-azure-app-service.yml`)
- [x] Requirements.txt includes gunicorn
- [x] Startup script created (`startup.sh`)

### Files Safe to Commit
- [x] `app.py` - No sensitive data
- [x] `index.html` - No sensitive data
- [x] `static/` - All frontend files
- [x] `requirements.txt` - Dependencies
- [x] `.github/workflows/deploy-azure-app-service.yml` - Deployment workflow
- [x] `README.md` - Documentation
- [x] Template files (`.example` files)

### Files Excluded (Not Committed)
- [x] `start_flask.ps1` - Contains connection string
- [x] `create_azuread_user.sql` - Contains email
- [x] `flask_app.log` - Log files
- [x] `.env` - Environment variables

## 📋 Azure Setup (One-Time)

### Step 1: Create Azure Resources
```bash
az group create --name rg-evidi-fab-game --location norwayeast
az appservice plan create --name plan-evidi-fab-game --resource-group rg-evidi-fab-game --sku B1 --is-linux
az webapp create --name evidi-fab-game --resource-group rg-evidi-fab-game --plan plan-evidi-fab-game --runtime "PYTHON:3.11"
```

### Step 2: Enable Managed Identity
```bash
az webapp identity assign --name evidi-fab-game --resource-group rg-evidi-fab-game
```

### Step 3: Add Managed Identity to Database
Get Object ID:
```bash
az webapp identity show --name evidi-fab-game --resource-group rg-evidi-fab-game --query principalId -o tsv
```

Run SQL:
```sql
CREATE USER [evidi-fab-game] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game];
ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game];
```

### Step 4: Set Connection String
```bash
az webapp config appsettings set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --settings SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no"
```

### Step 5: Set Startup Command
```bash
az webapp config set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --startup-file "gunicorn --bind 0.0.0.0:8000 --timeout 600 --workers 2 --threads 4 app:app"
```

### Step 6: Get Publish Profile for GitHub
```bash
az webapp deployment list-publishing-profiles \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --xml
```

### Step 7: Add GitHub Secrets
Go to: GitHub Repo → Settings → Secrets and variables → Actions

Add:
- `AZURE_WEBAPP_NAME` = `evidi-fab-game`
- `AZURE_WEBAPP_PUBLISH_PROFILE` = (XML from Step 6)

## 🎯 After Setup - Deploy!

### Just Commit and Push:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### What Happens:
1. ✅ GitHub Actions workflow runs automatically
2. ✅ Code deploys to Azure App Service
3. ✅ App restarts with new code
4. ✅ Your app is live at `https://evidi-fab-game.azurewebsites.net`

## 🔍 Verify Deployment

1. Check GitHub Actions: Repo → Actions tab
2. Check Azure: Portal → App Service → Deployment Center
3. Test app: `https://evidi-fab-game.azurewebsites.net`
4. Check logs: Azure Portal → App Service → Log stream

## 🐛 Troubleshooting

**Workflow fails:**
- Check GitHub secrets are set correctly
- Verify app name matches

**App won't start:**
- Check startup command in Azure Portal
- Verify requirements.txt has gunicorn
- Check logs in Azure Portal

**Database connection fails:**
- Verify Managed Identity is enabled
- Check Managed Identity is in database
- Verify connection string in App Settings

## 📝 Summary

**One-time:** Steps 1-7 above (~10 minutes)
**Every update:** Just `git commit` and `git push` - automatic!
