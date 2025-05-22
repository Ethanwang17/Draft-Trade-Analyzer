# NBA Draft Trade Analyzer Backend

This is the backend for the NBA Draft Trade Analyzer application, which provides APIs for storing and retrieving NBA team data, draft picks, and draft pick value information.

## Technologies Used

-   Node.js
-   Express.js
-   SQLite3 (default database)
-   PostgreSQL (optional database)
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

## Database Configuration

The application supports both SQLite (default) and PostgreSQL databases.

### SQLite (Default)

No additional configuration is needed for SQLite. The database file will be created in the backend directory.

### PostgreSQL

To use PostgreSQL:

1. Create a PostgreSQL database:

```bash
createdb draft_trade_analyzer
```

2. Configure environment variables:

    - Copy the `.env.example` file to `.env`
    - Update the PostgreSQL configuration in the `.env` file
    - Set `DB_TYPE=postgres`

3. Migrate existing data from SQLite to PostgreSQL (optional):

```bash
npm run migrate
```

4. Or seed directly into PostgreSQL:

```bash
npm run seed:pg
```

5. Start the server with PostgreSQL:

```bash
npm run start:pg
```

Or for development:

```bash
npm run dev:pg
```

## Available API Endpoints

### Teams

-   **GET /api/teams** - Get all NBA teams

### Draft Picks

-   **GET /api/draft-picks** - Get all draft picks
-   **GET /api/teams/:teamId/picks** - Get all picks for a specific team

### Pick Values

-   **GET /api/pick-values** - Get all pick values
-   **GET /api/pick-value/:pickNumber** - Get value for a specific pick number
-   **GET /api/pick-value/:pickNumber/:valuation** - Get value using specific valuation model
-   **GET /api/future-pick-value/:year/:round/:valuation** - Calculate value for future pick

### Saved Trades

-   **GET /api/saved-trades** - Get all saved trades
-   **GET /api/saved-trades/:id** - Get a specific saved trade
-   **GET /api/trades/:id/full** - Get complete trade data for trade builder
-   **POST /api/saved-trades** - Save a new trade
-   **DELETE /api/saved-trades/:id** - Delete a saved trade

### Valuation Models

-   **GET /api/valuations** - Get all valuation models
-   **POST /api/valuation-models** - Create a new valuation model

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
-   `pick_number`: INTEGER
-   `valuation`: INTEGER

### Valuations Table

-   `id`: INTEGER PRIMARY KEY
-   `name`: TEXT
-   `table_name`: TEXT
-   `description`: TEXT

### Valuation Tables (valuation_1, valuation_2, etc.)

-   `id`: INTEGER PRIMARY KEY
-   `pick_position`/`pick_number`: INTEGER
-   `value`: NUMERIC
-   `normalized`: NUMERIC

### Saved Trades Table

-   `id`: INTEGER PRIMARY KEY
-   `created_at`: TIMESTAMP
-   `trade_name`: TEXT
-   `valuation_model_id`: INTEGER

### Saved Trade Teams Table

-   `id`: INTEGER PRIMARY KEY
-   `saved_trade_id`: INTEGER (Foreign key to Saved Trades)
-   `team_id`: INTEGER (Foreign key to Teams)
-   `team_order`: INTEGER

### Saved Trade Picks Table

-   `id`: INTEGER PRIMARY KEY
-   `saved_trade_id`: INTEGER (Foreign key to Saved Trades)
-   `draft_pick_id`: INTEGER (Foreign key to Draft Picks)
-   `sending_team_id`: INTEGER (Foreign key to Teams)
-   `receiving_team_id`: INTEGER (Foreign key to Teams)
