# Quick Start Guide

## Step 1: Add Connection String to Azure

1. Deploy your app to Azure Static Web Apps (via GitHub or Azure CLI)
2. Go to Azure Portal → Your Static Web App → Functions
3. Click on your Function App name
4. Go to **Configuration** → **Application settings**
5. Click **+ New application setting**
6. Add:
   - **Name**: `SQL_CONNECTION_STRING`
   - **Value**: 
   ```
   Data Source=p2gnhr3dygrenigvwm3xdtyqxi-6ib77xdge2vejmpy73gdwddani.database.fabric.microsoft.com,1433;Initial Catalog=FabFeb-c6054871-25cf-4914-a1d1-4017cc61d71d;Multiple Active Result Sets=False;Connect Timeout=30;Encrypt=True;Trust Server Certificate=False
   ```
   (Note: Remove `Authentication=Active Directory Interactive` - Managed Identity will be used automatically)
7. Click **Save**

## Step 2: Enable Managed Identity

1. In the same Function App, go to **Identity**
2. Turn **ON** "System assigned managed identity"
3. Click **Save**

## Step 3: Grant Database Access

You need to add the Function App's Managed Identity to your Fabric SQL Database:

1. Go to your Fabric workspace → Your SQL Database
2. Click **Manage** → **SQL query editor** (or use Azure Data Studio)
3. Run this SQL (replace `your-function-app-name` with your actual Function App name):
   ```sql
   CREATE USER [your-function-app-name] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [your-function-app-name];
   ALTER ROLE db_datawriter ADD MEMBER [your-function-app-name];
   ALTER ROLE db_ddladmin ADD MEMBER [your-function-app-name];
   ```

   Or find the Managed Identity Object ID:
   - Go to Function App → Identity → System assigned
   - Copy the **Object (principal) ID**
   - Use it in SQL:
   ```sql
   CREATE USER [<object-id>] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [<object-id>];
   ALTER ROLE db_datawriter ADD MEMBER [<object-id>];
   ALTER ROLE db_ddladmin ADD MEMBER [<object-id>];
   ```

## Step 4: Test

1. Open your Static Web App URL
2. Fill out the registration form
3. Click "Start Game"
4. Check your SQL Database - you should see a new row in the `GameUsers` table

## Troubleshooting

**Error: "Login failed for user"**
- Make sure Managed Identity is enabled
- Verify the Managed Identity has been added to the database

**Error: "Cannot open server"**
- Check firewall rules - Azure services should be allowed
- Verify the connection string is correct

**Table not created**
- The Function will create it automatically on first run
- Check Function logs in Azure Portal for errors
