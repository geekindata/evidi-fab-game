#r "Newtonsoft.Json"

using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Azure.Core;
using Azure.Identity;

public static async Task<IActionResult> Run(HttpRequest req, ILogger log)
{
    log.LogInformation("C# HTTP trigger function processed a request.");

    try
    {
        // Read request body
        string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
        dynamic data = JsonConvert.DeserializeObject(requestBody);
        
        string name = data?.name;
        string email = data?.email;
        string fabricExperience = data?.fabricExperience;
        string description = data?.description;
        string canContact = data?.canContact;

        // Validate input
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || 
            string.IsNullOrEmpty(fabricExperience) || string.IsNullOrEmpty(description) || 
            string.IsNullOrEmpty(canContact))
        {
            return new BadRequestObjectResult("All fields are required.");
        }

        // Get connection string from environment variable
        string connectionString = Environment.GetEnvironmentVariable("SQL_CONNECTION_STRING");
        
        if (string.IsNullOrEmpty(connectionString))
        {
            log.LogError("SQL_CONNECTION_STRING is not set");
            return new StatusCodeResult(500);
        }

        log.LogInformation($"Connection string retrieved (length: {connectionString.Length})");

        // Insert into database
        // For Microsoft Fabric SQL, we need to use SQL Authentication or Managed Identity
        // The connection string should include User ID and Password for SQL Authentication
        // OR we can use Managed Identity if configured
        
        SqlConnection connection = null;
        try
        {
            // First, try Managed Identity (works if Static Web App has managed identity enabled)
            try
            {
                var credential = new DefaultAzureCredential();
                var tokenRequestContext = new TokenRequestContext(new[] { "https://database.windows.net/.default" });
                var token = await credential.GetTokenAsync(tokenRequestContext);
                
                // Create connection without AccessToken first, then set it
                connection = new SqlConnection(connectionString);
                connection.AccessToken = token.Token;
                log.LogInformation("Using Managed Identity authentication");
            }
            catch (Exception authEx)
            {
                // Managed Identity not available, use connection string as-is
                // Connection string should have User ID and Password for SQL Authentication
                log.LogWarning($"Managed Identity not available: {authEx.Message}");
                log.LogInformation("Attempting SQL Authentication with connection string");
                connection = new SqlConnection(connectionString);
            }
            
            log.LogInformation("Attempting to open database connection...");
            await connection.OpenAsync();
            log.LogInformation("Database connection opened successfully");
            
            string query = @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GameUsers')
                BEGIN
                    CREATE TABLE GameUsers (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(100) NOT NULL,
                        Email NVARCHAR(255) NOT NULL,
                        FabricExperience NVARCHAR(200) NOT NULL,
                        Description NVARCHAR(500) NOT NULL,
                        CanContact NVARCHAR(10) NOT NULL,
                        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
                    )
                END
                
                -- Handle table migration if old columns exist
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GameUsers') AND name = 'Role')
                BEGIN
                    ALTER TABLE GameUsers DROP COLUMN Role;
                END
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GameUsers') AND name = 'Company')
                BEGIN
                    ALTER TABLE GameUsers DROP COLUMN Company;
                END
                
                -- Add new columns if they don't exist
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GameUsers') AND name = 'FabricExperience')
                BEGIN
                    ALTER TABLE GameUsers ADD FabricExperience NVARCHAR(200) NULL;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GameUsers') AND name = 'Description')
                BEGIN
                    ALTER TABLE GameUsers ADD Description NVARCHAR(500) NULL;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GameUsers') AND name = 'CanContact')
                BEGIN
                    ALTER TABLE GameUsers ADD CanContact NVARCHAR(10) NULL;
                END
                
                INSERT INTO GameUsers (Name, Email, FabricExperience, Description, CanContact)
                VALUES (@Name, @Email, @FabricExperience, @Description, @CanContact)";
            
            using (SqlCommand command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@Name", name);
                command.Parameters.AddWithValue("@Email", email);
                command.Parameters.AddWithValue("@FabricExperience", fabricExperience);
                command.Parameters.AddWithValue("@Description", description);
                command.Parameters.AddWithValue("@CanContact", canContact);
                
                await command.ExecuteNonQueryAsync();
                log.LogInformation("Data inserted successfully");
            }
        }
        finally
        {
            if (connection != null)
            {
                connection.Close();
                log.LogInformation("Database connection closed");
            }
        }

        log.LogInformation($"User data saved: {name} ({email}) - Experience: {fabricExperience}");

        return new OkObjectResult(new { 
            success = true, 
            message = "User data saved successfully" 
        });
    }
    catch (Exception ex)
    {
        log.LogError($"Error: {ex.Message}");
        log.LogError($"Stack trace: {ex.StackTrace}");
        log.LogError($"Inner exception: {ex.InnerException?.Message}");
        
        // Return more detailed error for debugging
        return new ObjectResult(new { 
            success = false, 
            error = ex.Message,
            details = ex.InnerException?.Message ?? "No inner exception"
        }) { StatusCode = 500 };
    }
}
