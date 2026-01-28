-- GameUsers table for Evidi Fab Game
-- This script creates the table with all required columns

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[GameUsers](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[FabricExperience] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](500) NOT NULL,
	[CanContact] [nvarchar](10) NOT NULL,
	[CreatedAt] [datetime2](7) NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[GameUsers] ADD PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

ALTER TABLE [dbo].[GameUsers] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
