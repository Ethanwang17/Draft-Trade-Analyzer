# Vercel Deployment Guide

This document explains how to deploy the frontend application to Vercel.

## Prerequisites

1. A Vercel account (free tier is sufficient)
2. Git repository with your code

## Deployment Steps

### 1. Update Environment Variables

Before deploying, make sure your backend URL is correctly set in:

- `.env.production` - For production environment
- `vercel.json` - In the API routes section

### 2. Push to GitHub

Make sure all your changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 3. Import Project to Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Vite
   - Build Command: npm run build:prod
   - Output Directory: dist
   - Install Command: npm install

### 4. Environment Variables

Add the following environment variables in the Vercel project settings:

- `VITE_API_BASE_URL`: URL of your backend API (e.g., https://your-backend-api.com)
- `VITE_APP_ENV`: Set to `production`

### 5. Deploy

Click "Deploy" and wait for the build to complete.

## Troubleshooting

### API Connection Issues

If your frontend can't connect to the backend API:

1. Check if the backend is deployed and accessible
2. Verify the `VITE_API_BASE_URL` environment variable is set correctly
3. Make sure CORS is properly configured on your backend

### Page Not Found on Refresh

If you get 404 errors when refreshing the page or accessing routes directly:

1. Make sure the `vercel.json` file is correctly configured with the right rewrites
2. Check that your router configuration doesn't have an incorrect basename

## Updating Your Deployment

For subsequent deployments, simply push changes to your Git repository. Vercel will automatically build and deploy the new version.
