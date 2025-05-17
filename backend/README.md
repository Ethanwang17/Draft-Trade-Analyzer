# NBA Draft Trade Analyzer Backend

This is the backend for the NBA Draft Trade Analyzer application, which provides APIs for storing and retrieving NBA team data, draft picks, and draft pick value information.

## Technologies Used

-   Node.js
-   Express.js
-   SQLite3
-   CORS
-   Body Parser

## Setup Instructions

1. Make sure you have Node.js installed on your system
2. Install dependencies:

```bash
npm install
```

3. Seed the database with initial data (NBA teams and draft pick values):

```bash
npm run seed
```

4. Start the development server:

```bash
npm run dev
```

The server will be running at http://localhost:3000

## Available API Endpoints

### Teams

-   **GET /api/teams** - Get all NBA teams

### Draft Picks

-   **GET /api/draft-picks** - Get all draft picks

### Pick Values

-   **GET /api/pick-values** - Get all pick values

## Database Schema

### Teams Table

-   `id`: INTEGER PRIMARY KEY
-   `name`: TEXT
-   `abbreviation`: TEXT
-   `logo`: TEXT

### Draft Picks Table

-   `id`: INTEGER PRIMARY KEY
-   `team_id`: INTEGER (Foreign key to Teams)
-   `year`: INTEGER
-   `round`: INTEGER
-   `original_team_id`: INTEGER (Foreign key to Teams)
-   `protected`: TEXT

### Pick Values Table

-   `id`: INTEGER PRIMARY KEY
-   `pick_position`: INTEGER
-   `value`: REAL
-   `normalized`: REAL
