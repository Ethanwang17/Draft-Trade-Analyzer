# NBA Draft Trade Analyzer

A web application that allows users to calculate and compare the value of NBA draft picks in potential trade scenarios. This tool helps decision makers in creating and evaluating trade concepts involving draft picks.

## Live Website: [https://draft-trade-analyzer.vercel.app](https://draft-trade-analyzer.vercel.app)

## Features

-   **Drag-and-drop interface** for trading draft picks between teams
-   **Real-time trade analysis** showing value gained or lost in trades
-   **Multiple team support** for complex, multi-team trades (up to 4 teams)
-   **Save and compare trades** to evaluate different trade scenarios
-   **Visual trade balance representation** with radar charts
-   **Support for future picks** with appropriate value depreciation

## Project Structure

-   `backend/`: Node.js/Express API with PostgreSQL database
-   `frontend/`: React application built with Vite

## Implementation Details

### Frontend

-   Built with React 19 using Vite
-   Drag-and-drop functionality using `@dnd-kit` libraries
-   UI components from Ant Design
-   Data visualization with Recharts
-   Hosted on Vercel

### Backend

-   Express.js REST API
-   PostgreSQL database hosted on Render.com
-   Support for multiple pick valuation models
-   Depreciation model for future draft picks

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn
-   PostgreSQL

### Running the Backend

1. Navigate to the backend directory:

    ```
    cd backend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Set up environment variables:

    - Create a `.env` file based on `.env.example`
    - Configure your PostgreSQL connection string

4. Seed the database:

    ```
    npm run seed
    ```

5. Start the server:
    ```
    npm start
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

## Database Structure

The application uses PostgreSQL with the following tables:

-   `teams`: NBA teams with their names, abbreviations, and logos
-   `draft_picks`: Draft picks for each team from 2025 to 2031
-   `valuation_1`: Values assigned to each draft pick position
-   `valuations`: Different valuation models for assessing pick worth
-   `saved_trades`: User-saved trade scenarios
-   `saved_trade_teams`: Teams involved in saved trades
-   `saved_trade_picks`: Picks involved in saved trades

## Core Functionality

### Trade Building

Users can:

-   Select up to 4 teams to participate in a trade
-   View each team's available draft picks
-   Drag and drop picks between teams to create trades
-   Reset trades or individual picks

### Trade Analysis

-   Automatic calculation of pick values based on selected model
-   Visual representation of trade balance
-   Team-by-team breakdown of picks gained and lost
-   Radar chart visualization showing value distribution

### Trade Management

-   Save trades with custom names
-   View and compare previously saved trades

## Future Enhancements

-   Advanced filtering options for picks
-   Custom valuation model creation
-   Mobile-responsive design optimizations
-   User authentication and personal trade libraries
-   Export/share trade scenarios

## Development Notes

This project was built as part of an NBA analytics tool assessment. The valuation system is based on historical draft value charts with a time depreciation model for future picks.
