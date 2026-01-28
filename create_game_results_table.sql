-- GameResults table for tracking all game attempts
-- This table stores each game attempt separately, allowing users to play multiple times

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[GameResults](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[Score] [int] NOT NULL,
	[QualifiedForRaffle] [bit] NOT NULL DEFAULT 0,
	[CompletedAt] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
	PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [FK_GameResults_GameUsers] FOREIGN KEY ([UserId]) 
		REFERENCES [dbo].[GameUsers] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

-- Index for efficient winner queries
CREATE NONCLUSTERED INDEX [IX_GameResults_QualifiedForRaffle] 
ON [dbo].[GameResults] ([QualifiedForRaffle] ASC)
WHERE [QualifiedForRaffle] = 1
GO

-- Index for user lookup
CREATE NONCLUSTERED INDEX [IX_GameResults_UserId] 
ON [dbo].[GameResults] ([UserId] ASC)
GO

-- Index for email lookup (if needed)
CREATE NONCLUSTERED INDEX [IX_GameResults_Email] 
ON [dbo].[GameResults] ([Email] ASC)
GO

PRINT 'GameResults table created successfully!'
GO
