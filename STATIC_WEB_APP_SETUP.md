# Azure Static Web Apps Setup Guide

## ✅ What Changed

Your app is now configured for **Azure Static Web Apps** instead of App Service:

- ✅ Frontend: `index.html` + `static/` folder (served as static files)
- ✅ Backend: `api/save_user/` (Azure Function for saving data)
- ✅ Workflow: `.github/workflows/azure-static-web-apps-deploy.yml`

## 🚀 One-Time Setup

### Step 1: Get Deployment Token

1. Go to Azure Portal → Your Static Web App (`evidi-fab-game-dev`)
2. Go to **Settings** → **Deployment tokens**
3. Copy the **Deployment token**

### Step 2: Add GitHub Secret

1. Go to GitHub Repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Value: Paste the deployment token from Step 1
5. Click **Add secret**

### Step 3: Configure Static Web App Settings

In Azure Portal → Static Web App → **Configuration** → **Application settings**, add:

**Name:** `SQL_CONNECTION_STRING`  
**Value:** `Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER.database.fabric.microsoft.com,1433;Database=YOUR_DATABASE_NAME;Encrypt=yes;TrustServerCertificate=no`

**Note:** For Azure Functions in Static Web Apps, you can use Managed Identity or connection string authentication.

### Step 4: Enable Managed Identity (Optional but Recommended)

```bash
az staticwebapp identity assign \
  --name evidi-fab-game-dev \
  --resource-group YOUR_RESOURCE_GROUP
```

Then add the Managed Identity to your database (same as App Service setup).

## 📋 After Setup

Just commit and push - GitHub Actions will automatically deploy!

```bash
git add .
git commit -m "Convert to Azure Static Web Apps"
git push origin main
```

## 🔍 Differences from App Service

| Feature | App Service | Static Web Apps |
|---------|-------------|-----------------|
| Frontend | Flask serves HTML | Static files served directly |
| Backend | Flask routes | Azure Functions |
| Cost | Pay per hour | Free tier available |
| Scaling | Manual | Automatic |
| Authentication | Managed Identity | Managed Identity + Easy Auth |

## 🎯 Benefits of Static Web Apps

- ✅ **Free tier** available
- ✅ **Automatic HTTPS** and custom domains
- ✅ **Built-in authentication** (optional)
- ✅ **Automatic scaling**
- ✅ **Simpler deployment** (no startup scripts needed)

## 🐛 Troubleshooting

**Function not found:**
- Check `api/save_user/__init__.py` exists
- Verify `api/host.json` exists
- Check logs in Azure Portal → Static Web App → Functions

**Database connection fails:**
- Verify `SQL_CONNECTION_STRING` is set in Configuration
- Check Managed Identity is enabled (if using)
- Verify database permissions

**Deployment fails:**
- Check `AZURE_STATIC_WEB_APPS_API_TOKEN` secret is set
- Verify workflow file is correct
- Check GitHub Actions logs
