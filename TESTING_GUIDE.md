# Stats React - Local Testing Guide

This guide will help you test the Stats React application locally with remote network access.

## Prerequisites

✅ All dependencies are installed:
- Backend Python packages in `backend/venv/`
- Frontend npm packages in `frontend/node_modules/`

## Network Configuration

**Development Machine IP:** `172.29.28.157`

### Access Points:
- **Frontend (Local):** http://localhost:5173
- **Frontend (Network):** http://172.29.28.157:5173
- **Backend (Local):** http://localhost:5000
- **Backend (Network):** http://172.29.28.157:5000

## Quick Start (Recommended)

### Terminal 1: Start Backend Server

```bash
cd /home/chanavee/Documents/venv/Stats_React
./start-backend.sh
```

Expected output:
```
Starting Stats React Backend...
Server will run on http://172.29.28.157:5000

Uvicorn running on http://0.0.0.0:5000
```

### Terminal 2: Start Frontend Server

```bash
cd /home/chanavee/Documents/venv/Stats_React
./start-frontend.sh
```

Expected output:
```
Starting Stats React Frontend...

Frontend will run on:
  - http://localhost:5173 (local)
  - http://172.29.28.157:5173 (network)

VITE v5.x.x  ready in XXX ms
```

### Terminal 3 (Optional): Test API Health

```bash
curl http://172.29.28.157:5000/api/health
```

Expected response:
```json
{"status": "ok", "service": "Stats React API"}
```

## Testing the Application

### 1. Local Testing (from 172.29.28.157)

Open your browser and go to:
```
http://172.29.28.157:5173
```

Or if testing locally:
```
http://localhost:5173
```

### 2. Remote Testing (from another computer on the network)

From a different computer on the same network (e.g., 192.168.x.x), open:
```
http://172.29.28.157:5173
```

## Test Workflows

### Test 1: File Upload (Basic)

1. Open http://172.29.28.157:5173 in your browser
2. Click "Select File" or drag & drop a sample dataset
3. Upload `sample_data/small_dataset.csv`
4. Expected: File uploaded successfully with data preview

**Expected Response:**
```
File: small_dataset.csv
Rows: 7
Columns: 7 (age, height, weight, gender, blood_pressure, cholesterol, active)
Preview: Table showing first 5 rows
```

### Test 2: Data Preview

1. After uploading, click "Data Preview" tab
2. Should see the full data table
3. Verify all rows and columns are displayed correctly

### Test 3: Descriptive Statistics Analysis

1. Click "Analysis" tab
2. Select "Descriptive Statistics"
3. Enter columns: `age, height, weight` (numeric columns)
4. Click "Run Analysis"
5. Expected: Shows mean, std, min, max, quartiles

**Expected Response:**
```json
{
  "analysis_type": "descriptive",
  "columns_analyzed": ["age", "height", "weight"],
  "results": {
    "age": {
      "count": 7,
      "mean": 45.14,
      "std": 12.34,
      "min": 25.0,
      "25%": 35.0,
      "50%": 45.0,
      "75%": 55.0,
      "max": 65.0
    },
    ...
  }
}
```

### Test 4: Correlation Matrix Analysis

1. Click "Analysis" tab
2. Select "Correlation Matrix"
3. Enter columns: `age, height, weight, cholesterol`
4. Click "Run Analysis"
5. Expected: Shows correlation between variables

### Test 5: Distribution Analysis

1. Click "Analysis" tab
2. Select "Distribution Analysis"
3. Enter columns: `age, weight`
4. Click "Run Analysis"
5. Expected: Shows skewness, kurtosis, normality test results

### Test 6: Large File Upload (Optional)

1. Upload `sample_data/large_dataset.xlsx`
2. Verify it loads successfully
3. Run different analyses on it
4. Check performance and response times

## Troubleshooting

### Frontend Not Loading

**Problem:** Page shows "Cannot reach server"

**Solutions:**
1. Verify backend is running: `curl http://172.29.28.157:5000/api/health`
2. Check browser console for errors (F12)
3. Verify CORS is configured: Check browser Network tab for CORS errors
4. Restart both services

### CORS Error in Console

**Problem:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
```
Backend ALLOWED_ORIGINS needs to include frontend URL:
- Frontend: http://172.29.28.157:5173
- Check backend/.env.local has correct origin
```

### File Upload Fails

**Problem:** "Failed to upload file" error

**Solutions:**
1. Verify file is CSV or Excel format
2. File size is less than 50MB
3. Check backend logs for detailed error
4. Try with `small_dataset.csv` first

### Backend Won't Start

**Problem:** `ModuleNotFoundError` or `port already in use`

**Solutions:**
1. Activate venv: `source backend/venv/bin/activate`
2. Kill existing process: `lsof -i :5000` and `kill PID`
3. Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Dependencies Issue

**Problem:** `npm ERR! code ERESOLVE` or dependency conflicts

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Browser Developer Tools

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Upload a file
4. Look for API requests:
   - `POST /api/upload` - File upload request
   - `POST /api/analyze` - Analysis request
5. Check response status (200 = success, 4xx/5xx = error)

### Check Console for Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. API error responses will show here

### Check Network Issues

1. Open DevTools (F12)
2. Go to Network tab
3. If you see CORS errors, backend CORS config needs updating
4. If you see 404 errors, API endpoint might be wrong

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://172.29.28.157:5000        # API for direct calls
VITE_API_TARGET=http://172.29.28.157:5000     # Vite proxy target
VITE_DEBUG=true                                 # Debug mode
```

### Backend (.env.local)
```
DEBUG=True                                      # Debug mode
PORT=5000                                       # Server port
ALLOWED_ORIGINS=http://172.29.28.157:5173,...  # CORS allowed origins
LOG_LEVEL=INFO                                  # Logging level
```

## Performance Testing

### Measure Upload Speed

1. Note the time when you select a file
2. Watch the "Uploading..." status
3. Note the time when upload completes
4. Time = completion time - start time

### Measure Analysis Speed

1. Start analysis
2. Watch the "Analyzing..." status
3. Results should appear within 1-5 seconds depending on file size

### Expected Times (small_dataset.csv)
- Upload: < 1 second
- Descriptive Stats: < 1 second
- Correlation: < 1 second
- Distribution: 1-2 seconds

## Sample Data Description

### small_dataset.csv (325 bytes, 7 rows)
```
Columns: age, height, weight, gender, blood_pressure, cholesterol, active
Sample:
  Age range: 25-65 years
  Height: 160-180 cm
  Weight: 50-80 kg
  Blood Pressure: 110-140 mmHg
  Cholesterol: 150-250 mg/dL
  Active: Yes/No
```

### large_dataset.xlsx (113 KB, many rows)
Similar structure but with more rows for comprehensive testing.

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Frontend loads at http://172.29.28.157:5173
- [ ] API health check passes
- [ ] Can upload small_dataset.csv
- [ ] Data preview displays correctly
- [ ] Can run descriptive statistics
- [ ] Can run correlation analysis
- [ ] Can run distribution analysis
- [ ] Can upload large_dataset.xlsx
- [ ] No CORS errors in console
- [ ] No network errors in DevTools
- [ ] Results display correctly
- [ ] Remote access from another network computer works

## Next Steps

After successful local testing:
1. ✅ Test completed
2. ⏳ Initialize Git and push to GitHub
3. ⏳ Deploy to Render.com
4. ⏳ Verify Render deployment

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check backend logs (Terminal output)
3. Try with sample_data/small_dataset.csv first
4. Verify network connectivity
5. Verify environment variables are correct

---

**Last Updated:** 2025-12-13
**Status:** Ready for Local Testing
