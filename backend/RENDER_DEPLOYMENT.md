# Render.com Deployment Guide for Backend

This guide explains how to deploy the backend API to Render.com.

## Prerequisites

1. A Render.com account (free tier won't work as you need a PostgreSQL database)
2. Your code pushed to a Git repository (GitHub, GitLab, etc.)

## Step 1: Set Up PostgreSQL Database

1. Log in to your Render.com account
2. Click on "New" and select "PostgreSQL"
3. Configure your database:
    - Name: `draft-trade-analyzer-db` (or any name you prefer)
    - Database: `draft_trade_analyzer` (must match PG_DATABASE in your code)
    - User: Leave as default or customize
    - Region: Choose closest to your users
    - PostgreSQL Version: 15 (or latest stable)
4. Click "Create Database"
5. Once created, note down the following information:
    - Internal Database URL
    - External Database URL
    - User
    - Password
    - Host
    - Port

## Step 2: Deploy the Web Service

### Option 1: Using render.yaml (Recommended)

1. Make sure `render.yaml` is in the root of your backend directory
2. Go to Render Dashboard and click "New" > "Blueprint"
3. Connect your Git repository
4. Render will detect the `render.yaml` file and set up the service
5. Configure the environment variables (see below)

### Option 2: Manual Deployment

1. In your Render dashboard, click "New" and select "Web Service"
2. Connect your Git repository
3. Configure the service:
    - Name: `draft-trade-analyzer-api`
    - Environment: `Node`
    - Region: Choose closest to your users
    - Branch: `main` (or your default branch)
    - Build Command: `npm install`
    - Start Command: `npm start`
    - Auto-Deploy: Yes

## Step 3: Configure Environment Variables

Add these environment variables in your web service settings:

-   `NODE_ENV`: `production`
-   `PORT`: `10000` (Render's default port)
-   `PG_HOST`: The host value from your Render PostgreSQL instance
-   `PG_PORT`: The port value from your Render PostgreSQL instance (usually 5432)
-   `PG_DATABASE`: `draft_trade_analyzer`
-   `PG_USER`: The username from your Render PostgreSQL instance
-   `PG_PASSWORD`: The password from your Render PostgreSQL instance

## Step 4: Seed the Database

After your service is deployed, you'll need to seed the database:

1. Navigate to your web service in the Render dashboard
2. Go to the "Shell" tab
3. Run the seed command:
    ```
    node seed.js
    ```

## Step 5: Update Frontend Configuration

Update your Vercel deployment:

1. Go to your Vercel project settings
2. Update the environment variable `VITE_API_BASE_URL` to your Render backend URL (e.g., `https://draft-trade-analyzer-api.onrender.com`)
3. Update the `vercel.json` file to point to your Render backend

## Troubleshooting

### CORS Issues

If you encounter CORS issues, double-check:

1. The CORS configuration in `server.js` includes your Vercel domain
2. Your API requests are properly formatted with the correct URL

### Database Connection Issues

If your service can't connect to the database:

1. Verify the database environment variables are correct
2. Check if the database is running and accessible
3. Make sure the database user has the correct permissions

### Application Errors

If your application throws errors:

1. Check the logs in the Render dashboard
2. Verify that your code works correctly with the Render environment
