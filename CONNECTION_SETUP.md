# SQL Connection String Setup for Fabric Database

## Your Connection String

You've provided this connection string:
```
Data Source=p2gnhr3dygrenigvwm3xdtyqxi-6ib77xdge2vejmpy73gdwddani.database.fabric.microsoft.com,1433;Initial Catalog=FabFeb-c6054871-25cf-4914-a1d1-4017cc61d71d;Multiple Active Result Sets=False;Connect Timeout=30;Encrypt=True;Trust Server Certificate=False;Authentication=Active Directory Interactive
```

## For Azure Functions Deployment

Since Azure Functions can't use "Interactive" authentication, you have two options:

### Option 1: Use Managed Identity (Recommended for Production)

1. **Enable Managed Identity** on your Azure Function App:
   - Go to Azure Portal → Your Function App → Identity
   - Turn on "System assigned managed identity"

2. **Grant SQL Database Access**:
   - Go to your Fabric SQL Database
   - Add the Function App's Managed Identity as a user with appropriate permissions
   - Or use Azure SQL Admin to add the identity

3. **Update Connection String** in Azure Function App Settings:
   - Go to Azure Portal → Your Function App → Configuration → Application settings
   - Add/Edit: `SQL_CONNECTION_STRING`
   - Value:
   ```
   Data Source=p2gnhr3dygrenigvwm3xdtyqxi-6ib77xdge2vejmpy73gdwddani.database.fabric.microsoft.com,1433;Initial Catalog=FabFeb-c6054871-25cf-4914-a1d1-4017cc61d71d;Multiple Active Result Sets=False;Connect Timeout=30;Encrypt=True;Trust Server Certificate=False
   ```
   (Remove the `Authentication=Active Directory Interactive` part - the Function will use Managed Identity automatically)

4. The Function code will automatically use Managed Identity authentication.

### Option 2: Use SQL Authentication (Simpler for Testing)

If you prefer SQL username/password authentication:

1. **Create a SQL User** in your Fabric database:
   ```sql
   CREATE USER [your-username] WITH PASSWORD = 'your-strong-password';
   ALTER ROLE db_datareader ADD MEMBER [your-username];
   ALTER ROLE db_datawriter ADD MEMBER [your-username];
   ```

2. **Update Connection String**:
   ```
   Data Source=p2gnhr3dygrenigvwm3xdtyqxi-6ib77xdge2vejmpy73gdwddani.database.fabric.microsoft.com,1433;Initial Catalog=FabFeb-c6054871-25cf-4914-a1d1-4017cc61d71d;User ID=your-username;Password=your-strong-password;Multiple Active Result Sets=False;Connect Timeout=30;Encrypt=True;Trust Server Certificate=False
   ```

3. **Update the Function Code** to remove the token authentication part (use standard SqlConnection).

## For Local Development

For local testing, you can use the connection string as-is, but you'll need to authenticate interactively through Azure CLI:

```bash
az login
```

Then the DefaultAzureCredential will use your logged-in identity.

## Testing the Connection

You can test the connection using Azure Data Studio or SQL Server Management Studio with the same connection string.
