# Impostor Game Deployment Guide

This guide will help you deploy the Impostor Game using free platforms: **Render** for the backend server and **Vercel** for the frontend client.

## Part 1: Deploy Backend (Server)

We will use **Render** (render.com) to host the Node.js server.

1.  **Push to GitHub**:
    *   Make sure your project is pushed to a GitHub repository.
    *   Separate folders for `client` and `server` are fine in a single repo (monorepo).

2.  **Create Web Service on Render**:
    *   Sign up/Login to [Render](https://render.com).
    *   Click "New" -> "Web Service".
    *   Connect your GitHub repository.

3.  **Configure Service**:
    *   **Name**: `impostor-server` (or similar)
    *   **Root Directory**: `server` (Important: tell Render the code is in the server folder)
    *   **Environment**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
    *   **Free Instance**: Select the "Free" plan.

4.  **Environment Variables**:
    *   Scroll down to "Environment Variables".
    *   Add Key: `CLIENT_URL`
    *   Value: `*` (For now. Once frontend is deployed, you can update this to your specific frontend URL, e.g., `https://my-impostor-game.vercel.app`)

5.  **Deploy**:
    *   Click **Create Web Service**.
    *   Wait for the deployment to finish.
    *   Copy the **URL** provided by Render (e.g., `https://impostor-server.onrender.com`). You will need this for the frontend.

## Part 2: Deploy Frontend (Client)

We will use **Vercel** (vercel.com) to host the React frontend.

1.  **Create Project on Vercel**:
    *   Sign up/Login to [Vercel](https://vercel.com).
    *   Click "Add New..." -> "Project".
    *   Import the same GitHub repository.

2.  **Configure Project**:
    *   **Framework Preset**: Vite (should be detected automatically).
    *   **Root Directory**: Edit this and select `client`.

3.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add Key: `VITE_SERVER_URL`
    *   Value: Paste your Render Server URL (e.g., `https://impostor-server.onrender.com`). **Note**: No trailing slash is best.

4.  **Deploy**:
    *   Click **Deploy**.
    *   Wait for the build to complete.

## Part 3: Finalize

1.  **Test**: Open your new Vercel URL on your phone or computer.
2.  **Secure (Optional)**:
    *   Go back to your Render dashboard.
    *   Update the `CLIENT_URL` environment variable to match your specific Vercel URL to prevent other sites from using your server.

## Troubleshooting

*   **"Connecting..." forever?**: Check the browser console (F12). If you see CORS errors, check your `CLIENT_URL` on Render. If you see connection refused, check your `VITE_SERVER_URL` on Vercel.
*   **Cold Starts**: The free tier on Render spins down after inactivity. The first request might take 30-60 seconds to wake up the server. This is normal for the free tier.
