# NBA Draft Trade Analyzer

A web application that allows users to calculate and compare the value of NBA draft picks in potential trade scenarios. This tool helps decision makers in creating and evaluating trade concepts involving draft picks.

## Live Website: [https://draft-trade-analyzer.vercel.app](https://draft-trade-analyzer.vercel.app)

## Features

-   **Drag-and-drop interface** for trading draft picks between teams
-   **Real-time trade analysis** showing value gained or lost in trades
-   **Multiple team support** for complex, multi-team trades (up to 4 teams)
-   **Multiple valuation models** to analyze trades from different perspectives
-   **Save and compare trades** to evaluate different trade scenarios
-   **Data visualization** using radar charts, graphs, and tables to represent trade balance and key analytics
-   **Support for future picks** with value depreciation calculated as a 10% decrease from the average value of picks 1–60 in the selected valuation model
-   **Team-specific pick inventory** viewing all available draft assets
-   **Detailed value breakdown** for each team in trades

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

-   Select up to 4 teams to participate in a trade
-   View each team's draft pick inventory
-   Use a simple drag-and-drop interface to move picks between teams with auto-sorting
-   View a summary of what each team is sending and receiving, including:
    -   The draft picks involved
    -   The total value and number of picks
-   Hover over picks in the summary view to quickly delete them from the trade
-   Reset trades entirely or move individual picks back to their original teams
-   Delete teams from the trade setup
-   Change the valuation model to analyze trades from different perspectives

### Trade Analysis

-   View a message indicating which team is favored in the trade, including:
    -   Total value difference between teams
    -   Percentage advantage of the favored team
-   See a clear breakdown of:
    -   Picks each team is sending and receiving
    -   Value of each pick
    -   Total number of picks involved
    -   Net value gained or lost by each team
-   Change the valuation model to explore different analytical perspectives
-   View a RadarChart with customizable axes for alternative visual analysis
-   Save the current trade to review or compare later with other saved trades

### Saved Trades

-   View a quick overview of previously saved trades, including the teams involved
-   Click on a trade card to expand it and view detailed information such as:
    -   Draft picks traded
    -   Values of the picks
    -   Which team is favored in the trade
-   Use filters to:
    -   Show only trades involving specific teams
    -   Sort trades by saved date
    -   Change the valuation model used to recalculate and view trades from different analytical perspectives

## Future Enhancements

-   Add a page where users can manually input or create formulas to predict future NBA standings—either by specifying exact positions or broader categories like Lottery Teams, Mid-Tier Teams, and Top-Tier Teams
-   Expand the analysis page with deeper analytics and multiple tabs, including team-specific summaries
-   More advanced metrics and axes for RadarChart visualizations
-   Support for detailed pick protections, including Unprotected, Top-N Protected, Lottery Protected, and Swap options
-   Incorporate NBA trading restrictions into trade analysis, including the Stepien Rule, seven-year limit, etc.
-   Advanced filtering options for picks
-   Ability to delete valuation models
-   User authentication and personal trade libraries
-   Export/share trade scenarios
-   More in-depth saved trades comparison, including side-by-side trade views
-   Ability to edit saved trades without needing to save as a new one each time
