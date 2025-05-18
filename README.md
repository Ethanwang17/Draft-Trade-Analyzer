# NBA Draft Trade Analyzer

A web application for analyzing NBA draft pick trades.

## Features

-   Drag-and-drop interface for trading draft picks between teams
-   Real-time trade analysis
-   Database of NBA teams and their draft picks
-   Automatic loading of team draft picks from the database
-   Support for up to 6 teams in a trade

## Project Structure

-   `backend/`: Express.js server and SQLite database
-   `frontend/`: React application using Vite

## Getting Started

### Prerequisites

-   Node.js (v14+)
-   npm or yarn

### Running the Backend

1. Navigate to the backend directory:

    ```
    cd backend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Start the server:
    ```
    node server.js
    ```

The server will run on port 3000 by default.

### Running the Frontend

1. In a new terminal, navigate to the frontend directory:

    ```
    cd frontend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Start the development server:
    ```
    npm run dev
    ```

The frontend will run on port 5173 by default.

## Database

The application uses SQLite for database storage with the following tables:

-   `teams`: NBA teams with their names, abbreviations, and logos
-   `draft_picks`: Draft picks for each team from 2025 to 2031
-   `pick_values`: Values assigned to each draft pick position

## How to Use

1. Open the application in your browser
2. Select teams using the dropdown selectors
3. Each team's draft picks will automatically load from the database
4. Drag and drop picks between teams to create trades
5. Click "Analyze Trade" to evaluate the trade

## Development Notes

### Populating Draft Picks

If you need to populate or regenerate draft picks, use the provided scripts:

```
cd backend
node populate_draft_picks.js
```

This will create draft picks for all teams from 2025 to 2031 with pick numbers assigned for 2025.
