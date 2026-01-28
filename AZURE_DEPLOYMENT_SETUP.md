# Complete Azure Deployment Setup Guide

## 🚀 One-Time Setup (Do This First)

After you commit to git, you need to do a **one-time setup** in Azure. After that, every git push will automatically deploy!

### Step 1: Create Azure App Service

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

### Step 2: Enable Managed Identity

```bash
az webapp identity assign \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game
```

### Step 3: Get Managed Identity Object ID

```bash
az webapp identity show \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --query principalId -o tsv
```

**Save this Object ID** - you'll need it for the next step.

### Step 4: Add Managed Identity to Database

Run this SQL in Fabric SQL Query Editor (replace `evidi-fab-game` with your app name or use the Object ID):

```sql
-- Option 1: Using app name
CREATE USER [evidi-fab-game] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game];
ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game];

-- Option 2: Using Object ID (if Option 1 doesn't work)
-- CREATE USER [OBJECT_ID_FROM_STEP_3] FROM EXTERNAL PROVIDER;
-- ALTER ROLE db_datareader ADD MEMBER [OBJECT_ID_FROM_STEP_3];
-- ALTER ROLE db_datawriter ADD MEMBER [OBJECT_ID_FROM_STEP_3];
```

### Step 5: Set Connection String in Azure

**Replace `YOUR_SERVER` and `YOUR_DATABASE_NAME` with your actual values:**

```bash
az webapp config appsettings set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --settings SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no"
```

**Important:** 
- Do NOT include `Authentication=ActiveDirectoryInteractive`
- Do NOT include `User ID` or `Password`
- Managed Identity will be used automatically

### Step 6: Configure Startup Command

```bash
az webapp config set \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --startup-file "gunicorn --bind 0.0.0.0:8000 --timeout 600 --workers 2 --threads 4 app:app"
```

### Step 7: Get Publish Profile for GitHub Actions

```bash
# Get publish profile
az webapp deployment list-publishing-profiles \
  --name evidi-fab-game \
  --resource-group rg-evidi-fab-game \
  --xml
```

Copy the entire XML output.

### Step 8: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:

   **Secret Name:** `AZURE_WEBAPP_NAME`
   **Value:** `evidi-fab-game`

   **Secret Name:** `AZURE_WEBAPP_PUBLISH_PROFILE`
   **Value:** (Paste the XML from Step 7)

## ✅ After One-Time Setup

### What Happens When You Commit:

1. **You commit to git** → Push to GitHub
2. **GitHub Actions triggers** → Automatically runs
3. **Code deploys** → Flask app updates in Azure
4. **App restarts** → New code is live!

### You Don't Need To:
- ❌ Manually deploy
- ❌ Set connection string again (it's saved in Azure)
- ❌ Configure anything (already done)

### You Only Need To:
- ✅ Commit and push code
- ✅ That's it!

## 🔄 Workflow

```
1. You: git commit -m "Update code"
2. You: git push
3. GitHub: Detects push to main branch
4. GitHub Actions: Runs deploy workflow
5. Azure: Receives new code
6. Azure: Restarts app with new code
7. Done! App is live at https://evidi-fab-game.azurewebsites.net
```

## 📋 Checklist After First Deployment

- [ ] App is accessible at `https://evidi-fab-game.azurewebsites.net`
- [ ] Form submission works
- [ ] Data is saved to database
- [ ] Check logs: Azure Portal → App Service → Log stream

## 🛠️ Troubleshooting

**App won't start:**
- Check startup command is set: `gunicorn --bind 0.0.0.0:8000 ...`
- Verify `requirements.txt` includes `gunicorn`
- Check logs in Azure Portal

**Database connection fails:**
- Verify Managed Identity is enabled
- Check Managed Identity is added to database
- Verify connection string in App Settings (no User ID/Password)

**GitHub Actions fails:**
- Check secrets are set correctly
- Verify app name matches
- Check workflow file syntax

## 🎯 Summary

**One-time setup:** Steps 1-8 above (takes ~10 minutes)
**After that:** Just commit and push - deployment is automatic!
