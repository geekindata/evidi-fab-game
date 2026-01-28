# Quick Deployment Guide

## 🎯 Simple Answer

**After one-time setup:** Just commit and push - that's it!

## 📋 One-Time Setup (Do This Once)

### 1. Create Azure App Service
```bash
az group create --name rg-evidi-fab-game --location norwayeast
az appservice plan create --name plan-evidi-fab-game --resource-group rg-evidi-fab-game --sku B1 --is-linux
az webapp create --name evidi-fab-game --resource-group rg-evidi-fab-game --plan plan-evidi-fab-game --runtime "PYTHON:3.11"
```

### 2. Enable Managed Identity
```bash
az webapp identity assign --name evidi-fab-game --resource-group rg-evidi-fab-game
```

### 3. Add to Database
Run SQL (get Object ID first):
```sql
CREATE USER [evidi-fab-game] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game];
ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game];
```

### 4. Set Connection String
```bash
az webapp config appsettings set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --settings SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no"
```

### 5. Set Startup Command
```bash
az webapp config set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --startup-file "gunicorn --bind 0.0.0.0:8000 --timeout 600 --workers 2 --threads 4 app:app"
```

### 6. Setup GitHub Actions
- Get publish profile: `az webapp deployment list-publishing-profiles --name evidi-fab-game --resource-group rg-evidi-fab-game --xml`
- Add GitHub secrets:
  - `AZURE_WEBAPP_NAME` = `evidi-fab-game`
  - `AZURE_WEBAPP_PUBLISH_PROFILE` = (XML from above)

## ✅ After Setup - Just Commit!

```bash
git add .
git commit -m "Update app"
git push
```

**That's it!** GitHub Actions will automatically deploy to Azure.

## 🔄 What Happens Automatically

1. You push to git
2. GitHub Actions runs
3. Code deploys to Azure
4. App restarts
5. Done!

No manual steps needed after the one-time setup!
