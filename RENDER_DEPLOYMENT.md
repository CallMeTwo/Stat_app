# Stats React - Render Deployment Guide

This guide will help you deploy the Stats React application to Render.com.

## Prerequisites

✅ GitHub repository linked to Render: https://github.com/CallMeTwo/Stat_app
✅ Render account created at https://render.com
✅ Code pushed to GitHub

## Deployment Steps

### Step 1: Connect GitHub Repository to Render

1. Go to https://dashboard.render.com
2. Click "New +" button
3. Select "Web Service"
4. Choose "Deploy an existing repository"
5. Select your GitHub account if not connected
6. Find and select `CallMeTwo/Stat_app` repository
7. Click "Connect"

### Step 2: Configure Service Settings

**Name:** `stats-react` (or any name you prefer)

**Environment:** `Python 3`

**Build Command:**
```bash
pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
```

**Start Command:**
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Step 3: Set Environment Variables

In Render dashboard, go to "Environment" section and add:

```
DEBUG=False
PORT=5000
ALLOWED_ORIGINS=https://YOUR_FRONTEND_URL
LOG_LEVEL=INFO
```

**Note:** Replace `YOUR_FRONTEND_URL` with your actual frontend URL (will be assigned by Render)

### Step 4: Configure Static Files (Frontend)

1. Go to "Settings" tab
2. Under "Static Site Publishing", add:
   - **Directory:** `frontend/dist`
   - **Included Files:** Ensure this is configured to serve frontend static files

### Alternative: Using render.yaml (Recommended)

If using `render.yaml` (already in repository):

1. Render will automatically detect and use `render.yaml`
2. Both frontend and backend services will be created
3. Services will communicate via internal URLs

**Note:** The `render.yaml` file in your repository already has correct configuration

## Deployment Verification Checklist

After deployment, verify:

- [ ] Frontend service is deployed and running
- [ ] Backend service is deployed and running
- [ ] Health check endpoint works: `GET /api/health`
- [ ] Frontend can reach backend API
- [ ] File upload works
- [ ] Analysis functions return results
- [ ] No errors in Render logs
- [ ] CORS errors resolved

## Testing Deployed Application

### 1. Health Check
```bash
curl https://YOUR_BACKEND_URL/api/health
```

Should return:
```json
{"status": "ok", "service": "Stats React API"}
```

### 2. Test File Upload
Use the web interface to upload `sample_data/small_dataset.csv`

### 3. Check API Response
Open browser DevTools (F12) → Network tab → Upload file
Verify API request returns 200 OK

## Environment Variables Explained

| Variable | Value | Purpose |
|----------|-------|---------|
| `DEBUG` | `False` | Production mode |
| `PORT` | `5000` | Backend port (auto-set by Render) |
| `ALLOWED_ORIGINS` | Frontend URL | CORS configuration |
| `LOG_LEVEL` | `INFO` | Logging level |

## Troubleshooting Deployment

### Frontend Not Loading

**Problem:** Blank page or 404 error

**Solutions:**
1. Check Render logs for build errors
2. Verify `npm run build` succeeds locally
3. Check that `frontend/dist/` directory is created
4. Verify static file serving is configured

**To view logs:**
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Check for errors in build or runtime logs

### Backend Health Check Fails

**Problem:** Cannot reach `/api/health` endpoint

**Solutions:**
1. Check if backend service is running (green status)
2. Verify `PORT` environment variable is set
3. Check backend logs for startup errors
4. Try accessing: `https://YOUR_BACKEND_URL/api/health`

### CORS Errors

**Problem:** Frontend can't communicate with backend (Network tab shows CORS errors)

**Solutions:**
1. Get actual backend URL from Render dashboard
2. Update `ALLOWED_ORIGINS` environment variable with frontend URL
3. Restart backend service (redeploy)
4. Clear browser cache and refresh

### File Upload Returns 422 Error

**Problem:** Upload endpoint returns validation error

**Solutions:**
1. Verify file is CSV or Excel format
2. Check file size is less than 50MB
3. Review backend logs for detailed error
4. Try uploading `small_dataset.csv` first

### Slow Performance

**Problem:** Upload or analysis takes too long

**Solutions:**
1. Check Render resource usage
2. Verify database/storage is not bottleneck (if using)
3. Consider upgrading Render plan
4. Optimize large file handling

## Configuration Files Overview

### render.yaml
Defines both frontend and backend services for Render:
- Frontend service runs on Node
- Backend service runs on Python
- Both services communicate internally
- Static files served from `frontend/dist/`

### backend/requirements.txt
Python dependencies for backend:
- FastAPI, Uvicorn (API framework)
- Pandas, NumPy, SciPy (data analysis)
- Python-multipart (file uploads)
- Python-dotenv (environment variables)

### frontend/package.json
Node dependencies for frontend:
- React, Vite (UI framework)
- Axios (HTTP client)
- Chart.js (data visualization)

## Deployment Workflow

```
Local Development
    ↓
Test with sample data
    ↓
Git commit and push
    ↓
Render detects changes
    ↓
Render builds and deploys
    ↓
Access deployed app
    ↓
Verify functionality
```

## Getting Your Deployed URLs

After successful deployment:

1. Go to Render dashboard
2. Select your service
3. Find URLs in service details:
   - **Backend:** `https://YOUR_BACKEND.onrender.com`
   - **Frontend:** `https://YOUR_FRONTEND.onrender.com`

## Next Steps

1. Deploy to Render
2. Test with sample datasets
3. Monitor logs for errors
4. Optimize if needed
5. Share with users

## Support

### View Render Logs
1. Render Dashboard → Service → Logs tab

### Common Issues
Check `TROUBLESHOOTING.md` for more solutions

### Render Documentation
https://render.com/docs

---

**Last Updated:** 2025-12-13
**Status:** Ready for Deployment
