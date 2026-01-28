# How the Flask App Accesses the SQL Database

## 🔐 Authentication Flow

The Flask app authenticates **as itself** (not as end users) to connect to the database. Here's how it works:

## Two Scenarios

### Scenario 1: Local Development (Your Computer)

**What happens:**
1. Flask app starts
2. When it needs to connect to database, it uses `ActiveDirectoryInteractive`
3. A browser window opens asking **YOU** (the developer) to sign in with Azure AD
4. After you sign in, Flask gets a token
5. Flask uses that token to connect to the database
6. Token is cached, so you don't need to sign in again for a while

**Who signs in:** You (the developer running Flask)
**When:** First time Flask connects, then cached
**End users:** Never see this - they just use the website

### Scenario 2: Azure App Service (Production)

**What happens:**
1. Flask app is deployed to Azure App Service
2. Azure App Service has a **Managed Identity** (like a service account)
3. Flask uses `DefaultAzureCredential()` which automatically gets a token from Azure
4. No browser prompt - completely automatic!
5. Flask connects to database using the Managed Identity token

**Who signs in:** Nobody! It's automatic
**When:** Every time Flask connects (token is automatically refreshed)
**End users:** Never see anything - completely invisible

## Step-by-Step: How Flask Gets Database Access

### Local Development Flow:

```
1. Developer runs: python app.py
   ↓
2. User submits form on website
   ↓
3. Flask needs to save data → tries to connect to database
   ↓
4. Flask sees: Authentication=ActiveDirectoryInteractive
   ↓
5. Browser opens → Developer signs in with Azure AD
   ↓
6. Azure AD gives Flask an access token
   ↓
7. Flask uses token to connect to SQL database
   ↓
8. Data is saved!
```

### Azure App Service Flow:

```
1. Flask app deployed to Azure
   ↓
2. User submits form on website
   ↓
3. Flask needs to save data → tries to connect to database
   ↓
4. Flask calls: DefaultAzureCredential().get_token()
   ↓
5. Azure automatically provides token (no sign-in needed!)
   ↓
6. Flask uses token to connect to SQL database
   ↓
7. Data is saved!
```

## Database Permissions Setup

### For Local Development:

You (the developer) need to be added to the database:

```sql
-- Replace YOUR_EMAIL@domain.com with your Azure AD email
CREATE USER [YOUR_EMAIL@domain.com] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [YOUR_EMAIL@domain.com];
ALTER ROLE db_datawriter ADD MEMBER [YOUR_EMAIL@domain.com];
```

### For Azure App Service:

The App Service's Managed Identity needs to be added:

```sql
-- After enabling Managed Identity, get the Object ID
CREATE USER [evidi-fab-game] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game];
ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game];
```

## Key Points

✅ **End users NEVER authenticate** - they just use the website
✅ **Flask app authenticates** - using Azure AD (your account locally, Managed Identity in Azure)
✅ **No passwords in code** - uses secure token-based authentication
✅ **Automatic in Azure** - Managed Identity handles everything
✅ **One-time setup locally** - you sign in once, token is cached

## Security Model

```
┌─────────────┐
│  End User   │  (No authentication needed)
│  (Browser)   │
└──────┬──────┘
       │ HTTP Request
       ↓
┌─────────────┐
│ Flask App   │  ← Authenticates HERE (not the user!)
│  (Server)    │
└──────┬──────┘
       │ Azure AD Token
       ↓
┌─────────────┐
│ SQL Database│  (Checks Flask's token/permissions)
└─────────────┘
```

## Code Flow

In `app.py`, the `get_db()` function:

1. **Checks connection string** - looks for authentication method
2. **Tries Managed Identity** - uses `DefaultAzureCredential()` (works in Azure automatically)
3. **Falls back to ActiveDirectoryInteractive** - for local dev (browser prompt)
4. **Gets Azure AD token** - from Azure AD service
5. **Connects to database** - using token instead of password
6. **Database verifies token** - checks if Flask has permission

## Why This is Secure

- ✅ No passwords stored in code or connection strings
- ✅ Tokens expire automatically (security)
- ✅ Tokens are scoped to specific resources
- ✅ Azure AD manages all authentication
- ✅ End users never see or interact with database authentication

## Summary

**Question:** How does the app access the SQL database?

**Answer:** 
- The Flask app authenticates **as itself** using Azure AD
- Locally: Uses your Azure AD account (you sign in once)
- In Azure: Uses Managed Identity (automatic, no sign-in)
- End users: Never authenticate - they just use the website!
