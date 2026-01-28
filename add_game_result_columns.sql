-- Add game result columns to GameUsers table
-- This script adds columns to track game scores and raffle qualification

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Check if columns exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[GameUsers]') AND name = 'Score')
BEGIN
    ALTER TABLE [dbo].[GameUsers]
    ADD [Score] [int] NULL
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[GameUsers]') AND name = 'QualifiedForRaffle')
BEGIN
    ALTER TABLE [dbo].[GameUsers]
    ADD [QualifiedForRaffle] [bit] NULL DEFAULT 0
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[GameUsers]') AND name = 'GameCompletedAt')
BEGIN
    ALTER TABLE [dbo].[GameUsers]
    ADD [GameCompletedAt] [datetime2](7) NULL
END
GO

-- Add index on QualifiedForRaffle for efficient querying of winners
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GameUsers_QualifiedForRaffle' AND object_id = OBJECT_ID(N'[dbo].[GameUsers]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_GameUsers_QualifiedForRaffle] ON [dbo].[GameUsers]
    (
        [QualifiedForRaffle] ASC
    )
    WHERE [QualifiedForRaffle] = 1
END
GO

PRINT 'Game result columns added successfully!'
GO
