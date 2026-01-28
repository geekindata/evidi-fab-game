# GitHub Actions Deployment Guide

## ✅ Your Static Web App has been upgraded to Standard tier

However, if you want to use the **Free tier** with GitHub Actions (which is free!), follow these steps:

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `evidi-fab-game`)
3. **Don't** initialize with README (we already have files)

## Step 2: Push Your Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Evidi Fab Game"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/evidi-fab-game.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Connect Azure Static Web App to GitHub

### Option A: Via Azure Portal (Easiest)

1. Go to Azure Portal → Your Static Web App (`evidi-fab-game-dev`)
2. Click **"Manage deployment token"** → Copy the deployment token
3. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_WAVE_0FDE86103`
6. Value: Paste the deployment token
7. Click **"Add secret"**

### Option B: Via Azure CLI

```bash
# Get the deployment token
az staticwebapp secrets list --name evidi-fab-game-dev --resource-group rg-evidi-fab-game --query "properties.apiKey" -o tsv

# Then add it to GitHub Secrets manually via GitHub UI
```

## Step 4: Configure Static Web App to Use GitHub

```bash
az staticwebapp update \
  --name evidi-fab-game-dev \
  --resource-group rg-evidi-fab-game \
  --repository https://github.com/YOUR_USERNAME/evidi-fab-game \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "/" \
  --login-with-github
```

Or via Azure Portal:
1. Go to Static Web App → **"Deployment"**
2. Click **"GitHub"** → **"Authorize"**
3. Select your repository and branch
4. Configure:
   - App location: `/`
   - Api location: `api`
   - Output location: `/`

## Step 5: Verify GitHub Actions Workflow

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. You should see the workflow running
4. Once complete, your app will be deployed automatically!

## Step 6: (Optional) Downgrade to Free Tier

Once GitHub Actions is set up, you can downgrade to Free tier:

```bash
az staticwebapp update --name evidi-fab-game-dev --resource-group rg-evidi-fab-game --sku Free
```

Functions will work on Free tier when deployed via GitHub Actions!

## Benefits of GitHub Actions Deployment

✅ **Free** - No cost for GitHub Actions  
✅ **Automatic** - Deploys on every push to main  
✅ **Free Tier Compatible** - Functions work on Free tier  
✅ **CI/CD** - Automatic testing and deployment  
✅ **Pull Request Previews** - Test changes before merging  

## Troubleshooting

If the workflow fails:
1. Check GitHub Secrets are set correctly
2. Verify the workflow file is in `.github/workflows/`
3. Check Azure Portal → Static Web App → Deployment for errors
4. Review GitHub Actions logs for detailed error messages
