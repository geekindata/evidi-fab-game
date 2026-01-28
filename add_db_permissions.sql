-- Add database permissions for evidi-fab-game Managed Identity
-- Run this in Fabric SQL Query Editor

-- Check if user exists and add roles
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'evidi-fab-game')
BEGIN
    -- Add roles if not already assigned
    IF NOT EXISTS (
        SELECT * FROM sys.database_role_members rm
        JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
        JOIN sys.database_principals dp ON rm.member_principal_id = dp.principal_id
        WHERE dp.name = 'evidi-fab-game' AND r.name = 'db_datareader'
    )
    BEGIN
        ALTER ROLE db_datareader ADD MEMBER [evidi-fab-game];
        PRINT 'Added db_datareader role';
    END
    
    IF NOT EXISTS (
        SELECT * FROM sys.database_role_members rm
        JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
        JOIN sys.database_principals dp ON rm.member_principal_id = dp.principal_id
        WHERE dp.name = 'evidi-fab-game' AND r.name = 'db_datawriter'
    )
    BEGIN
        ALTER ROLE db_datawriter ADD MEMBER [evidi-fab-game];
        PRINT 'Added db_datawriter role';
    END
    
    PRINT 'Permissions configured successfully';
END
ELSE
BEGIN
    PRINT 'User evidi-fab-game does not exist. Create it first.';
END
