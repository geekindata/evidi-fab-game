# How to Query Winners

This document explains how to query the database to find all users who qualified for the raffle (winners).

## Database Schema

### GameUsers Table
Stores user registration information:
- `Id` (int): Primary key
- `Name`, `Email`, `FabricExperience`, `Description`, `CanContact`
- `CreatedAt`: Registration timestamp

### GameResults Table (NEW - Separate Table)
Stores each game attempt separately:
- `Id` (int): Primary key
- `UserId` (int): Foreign key to GameUsers
- `Email` (nvarchar): User's email (denormalized for convenience)
- `Score` (int): Game score (0-3)
- `QualifiedForRaffle` (bit): `1` if score >= 2, `0` otherwise
- `CompletedAt` (datetime2): Timestamp when game was completed

**Benefits of Separate Table:**
- ✅ Tracks all game attempts (full history)
- ✅ Users can play multiple times
- ✅ Better analytics and reporting
- ✅ Prevents data loss when users replay

## Query Winners

### Get All Unique Winners (One Entry Per User)

```sql
-- Get distinct winners (if a user won multiple times, they appear once)
SELECT DISTINCT
    u.Id,
    u.Name,
    u.Email,
    MAX(gr.Score) AS BestScore,
    MAX(gr.CompletedAt) AS LastPlayedAt,
    COUNT(gr.Id) AS TotalAttempts,
    SUM(CASE WHEN gr.QualifiedForRaffle = 1 THEN 1 ELSE 0 END) AS WinningAttempts
FROM [dbo].[GameUsers] u
INNER JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE gr.QualifiedForRaffle = 1
GROUP BY u.Id, u.Name, u.Email
ORDER BY BestScore DESC, LastPlayedAt DESC;
```

### Get All Winning Attempts (Full History)

```sql
-- Get all winning game attempts (users may appear multiple times)
SELECT 
    u.Name,
    u.Email,
    gr.Score,
    gr.CompletedAt,
    gr.Id AS GameResultId
FROM [dbo].[GameUsers] u
INNER JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE gr.QualifiedForRaffle = 1
ORDER BY gr.CompletedAt DESC;
```

### Get Winners Count (Unique Users)

```sql
SELECT COUNT(DISTINCT u.Id) AS TotalUniqueWinners
FROM [dbo].[GameUsers] u
INNER JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE gr.QualifiedForRaffle = 1;
```

### Get Total Winning Attempts

```sql
SELECT COUNT(*) AS TotalWinningAttempts
FROM [dbo].[GameResults]
WHERE QualifiedForRaffle = 1;
```

### Get Users Who Never Won (But Played)

```sql
SELECT 
    u.Name,
    u.Email,
    MAX(gr.Score) AS BestScore,
    COUNT(gr.Id) AS TotalAttempts
FROM [dbo].[GameUsers] u
INNER JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE u.Id NOT IN (
    SELECT DISTINCT UserId 
    FROM [dbo].[GameResults] 
    WHERE QualifiedForRaffle = 1
)
GROUP BY u.Id, u.Name, u.Email
ORDER BY BestScore DESC;
```

### Get Users Who Haven't Played Yet

```sql
SELECT 
    u.Name,
    u.Email,
    u.CreatedAt AS RegisteredAt
FROM [dbo].[GameUsers] u
LEFT JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE gr.Id IS NULL
ORDER BY u.CreatedAt DESC;
```

### Export Winners to CSV (for Excel/Raffle Drawing)

```sql
-- Unique winners with their best score
SELECT DISTINCT
    u.Name,
    u.Email,
    MAX(gr.Score) AS BestScore,
    MAX(gr.CompletedAt) AS LastPlayedAt,
    COUNT(gr.Id) AS TotalAttempts
FROM [dbo].[GameUsers] u
INNER JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE gr.QualifiedForRaffle = 1
GROUP BY u.Id, u.Name, u.Email
ORDER BY BestScore DESC, LastPlayedAt ASC;
```

### Get Game Statistics

```sql
SELECT 
    COUNT(DISTINCT u.Id) AS TotalUsers,
    COUNT(DISTINCT CASE WHEN gr.QualifiedForRaffle = 1 THEN u.Id END) AS UniqueWinners,
    COUNT(gr.Id) AS TotalGameAttempts,
    COUNT(CASE WHEN gr.QualifiedForRaffle = 1 THEN 1 END) AS TotalWinningAttempts,
    AVG(CAST(gr.Score AS FLOAT)) AS AverageScore,
    MAX(gr.Score) AS HighestScore
FROM [dbo].[GameUsers] u
LEFT JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId;
```

### Prevent Duplicate Raffle Entries (If Needed)

If you want to ensure each user can only enter the raffle once (even if they win multiple times):

```sql
-- Get one entry per winner (their first winning attempt)
SELECT 
    u.Name,
    u.Email,
    gr.Score,
    gr.CompletedAt
FROM [dbo].[GameUsers] u
INNER JOIN [dbo].[GameResults] gr ON u.Id = gr.UserId
WHERE gr.QualifiedForRaffle = 1
AND gr.Id = (
    SELECT MIN(gr2.Id)
    FROM [dbo].[GameResults] gr2
    WHERE gr2.UserId = u.Id
    AND gr2.QualifiedForRaffle = 1
)
ORDER BY gr.CompletedAt ASC;
```

## Migration

If you have an existing database with the old schema (Score columns in GameUsers), you can migrate the data:

```sql
-- Create GameResults table first (run create_game_results_table.sql)
-- Then migrate existing data:

INSERT INTO [dbo].[GameResults] (UserId, Email, Score, QualifiedForRaffle, CompletedAt)
SELECT 
    Id AS UserId,
    Email,
    Score,
    QualifiedForRaffle,
    GameCompletedAt
FROM [dbo].[GameUsers]
WHERE Score IS NOT NULL;

-- After migration, you can optionally remove the old columns:
-- ALTER TABLE [dbo].[GameUsers] DROP COLUMN Score;
-- ALTER TABLE [dbo].[GameUsers] DROP COLUMN QualifiedForRaffle;
-- ALTER TABLE [dbo].[GameUsers] DROP COLUMN GameCompletedAt;
```

## Notes

- Each game attempt is stored as a separate row in `GameResults`
- Users can play multiple times - all attempts are tracked
- Foreign key ensures data integrity (cascade delete if user is removed)
- Indexes optimize queries for winners and user lookups
- Use DISTINCT or GROUP BY when you need unique winners for raffle drawing
