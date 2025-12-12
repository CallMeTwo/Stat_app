# Stats_React - Development & Deployment Plan

## Project Overview
A full-stack statistical analysis web application where users can:
- Upload CSV/Excel data files
- Perform statistical analysis on the uploaded data
- View results, visualizations, and insights
- Deploy on Render.com with React frontend + Python backend

**Sample Data Available for Testing:**
- `small_dataset.csv` - Sample health metrics (325 bytes) with columns: age, height, weight, gender, blood_pressure, cholesterol, active
- `large_dataset.xlsx` - Larger dataset (113 KB) for comprehensive testing

---

## Phase 1: Project Structure & Setup

### 1.1 Directory Structure
```
Stats_React/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js       # Vite build config
│   └── .env.example
│
├── backend/                  # Python API server
│   ├── app.py               # Main application
│   ├── routes/              # API endpoints
│   ├── utils/               # Data processing utilities
│   ├── requirements.txt
│   └── .env.example
│
├── sample_data/             # Sample datasets for testing
│   ├── small_dataset.csv
│   └── large_dataset.xlsx
│
├── render.yaml              # Render deployment config
├── .gitignore
├── README.md
└── PLAN.md                  # This file

```

### 1.2 Tech Stack Decision
- **Frontend:** React + Vite (fast builds, modern)
- **Backend:** FastAPI or Flask (choose based on simplicity vs features)
- **Data Processing:** pandas, numpy, scipy
- **Deployment:** Render.com with render.yaml
- **File Handling:** python-multipart (backend), form-data (frontend)

### 1.3 Initial Setup Tasks
- [ ] Create directory structure
- [ ] Initialize React project with Vite: `npm create vite@latest frontend -- --template react`
- [ ] Initialize Python backend directory with virtual environment
- [ ] Create `.gitignore` to exclude node_modules, __pycache__, .env, venv/
- [ ] Create `.env.example` files for both frontend and backend
- [ ] Initialize Git and push initial structure to GitHub

---

## Phase 2: Frontend Development (React)

### 2.1 Core Features
1. **File Upload Component**
   - Accept .csv and .xlsx files
   - Show file preview before processing
   - Display upload progress

2. **Data Display Component**
   - Show data table/preview
   - Pagination for large datasets
   - Column filtering/sorting

3. **Analysis Options Component**
   - Select columns for analysis
   - Choose analysis type (descriptive stats, correlation, regression, etc.)
   - Options for statistical tests

4. **Results Display Component**
   - Tables for statistical summaries
   - Charts/graphs for visualization (use Chart.js or Plotly)
   - Export results option

5. **Navigation/Layout**
   - Header with app title
   - Navigation between upload and results
   - Error handling and loading states

### 2.2 API Integration
- Create `services/api.js` to handle backend communication
- Base URL: `process.env.REACT_APP_API_URL || 'http://localhost:5000'`
- Endpoints to call:
  - `POST /api/upload` - Upload file
  - `POST /api/analyze` - Run analysis
  - `GET /api/health` - Health check

### 2.3 Environment Variables
```
VITE_API_URL=http://localhost:5000  # Development
# In production (Render): VITE_API_URL will be set to backend service URL
```

### 2.4 Dependencies
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "axios": "^1.6.0",
  "react-router-dom": "^6.0.0",
  "chart.js": "^4.0.0",
  "react-chartjs-2": "^5.0.0"
}
```

---

## Phase 3: Backend Development (Python)

### 3.1 Framework Choice: FastAPI (Recommended)
- Modern, fast, automatic API documentation
- Built-in support for file uploads and validation
- Easy async/await support

### 3.2 API Endpoints

#### 3.2.1 Health Check
```
GET /api/health
Response: {"status": "ok"}
```

#### 3.2.2 File Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (CSV or XLSX)
Response: {
  "file_id": "uuid",
  "filename": "dataset.csv",
  "rows": 100,
  "columns": ["age", "height", ...],
  "preview": [[...], [...]]
}
```

#### 3.2.3 Data Analysis
```
POST /api/analyze
Body: {
  "file_id": "uuid",
  "analysis_type": "descriptive|correlation|regression",
  "columns": ["age", "weight"],
  "options": {}
}
Response: {
  "analysis_type": "descriptive",
  "results": {
    "mean": {...},
    "std": {...},
    "min": {...},
    "max": {...},
    "quartiles": {...}
  }
}
```

### 3.3 Core Functions
```python
# Data Processing Utilities
- load_file(file_path) → DataFrame
- validate_data(df) → bool
- get_descriptive_stats(df, columns) → dict
- get_correlation_matrix(df, columns) → dict
- perform_regression(df, target, features) → dict
- handle_missing_values(df) → DataFrame
```

### 3.4 Dependencies (requirements.txt)
```
fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.3
numpy==1.26.2
scipy==1.11.4
python-multipart==0.0.6
python-dotenv==1.0.0
pydantic==2.5.0
```

### 3.5 CORS Configuration
- Enable CORS for frontend origin (development: localhost:5173, production: Render frontend URL)
- Example:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend.render.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.6 Environment Variables
```
DATABASE_URL=  # If using database later
DEBUG=False
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.render.com
```

---

## Phase 4: Deployment Configuration (Render.yaml)

### 4.1 render.yaml Structure
```yaml
services:
  - type: web
    name: stats-react-frontend
    runtime: node
    buildCommand: "cd frontend && npm install && npm run build"
    startCommand: "cd frontend && npm run preview"
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        sync: false

  - type: web
    name: stats-react-backend
    runtime: python
    pythonVersion: 3.11
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DEBUG
        value: "false"
```

### 4.2 Environment Variables on Render
**Frontend:**
- `VITE_API_URL` = URL of backend service (auto-populated by Render)

**Backend:**
- `DEBUG` = false
- `PORT` = (auto-assigned by Render)
- `ALLOWED_ORIGINS` = frontend URL

### 4.3 Alternative: Separate Render Services
If using separate Render services (not render.yaml):
1. Create backend web service first
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`

2. Create frontend web service
   - Build: `npm install && npm run build`
   - Start: `npm run preview`
   - Link backend URL via environment variable

---

## Phase 5: Development & Testing

### 5.1 Local Development Setup
```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### 5.2 Testing with Sample Data
1. Start both frontend and backend servers
2. Open http://localhost:5173
3. Upload `small_dataset.csv` to test basic functionality
4. Upload `large_dataset.xlsx` to test with larger data
5. Test analysis features (descriptive stats, correlation, etc.)
6. Verify visualizations and export functionality

### 5.3 Checklist
- [ ] Frontend builds without errors: `npm run build`
- [ ] Backend starts without errors: `uvicorn app:app --reload`
- [ ] File upload works with .csv and .xlsx
- [ ] Frontend can communicate with backend (check network tab)
- [ ] Analysis results display correctly
- [ ] Error handling works for invalid data
- [ ] Sample datasets process without errors
- [ ] No console errors or warnings

---

## Phase 6: Render Deployment Verification

### 6.1 Pre-Deployment Checklist
- [ ] All code committed to GitHub
- [ ] `.env.example` files document all environment variables
- [ ] No secrets in code (no hardcoded API keys)
- [ ] `render.yaml` is in repository root
- [ ] Frontend build script produces static files in `dist/` folder
- [ ] Backend has proper error handling and logging
- [ ] CORS is configured for production URLs
- [ ] Health check endpoint works

### 6.2 Render Dashboard Setup
1. Connect GitHub repository to Render
2. Configure deploy hook on GitHub (if not using render.yaml)
3. Set environment variables in Render dashboard
4. Review build logs for errors
5. Test health check endpoints on deployed services
6. Verify frontend can connect to backend API

### 6.3 Post-Deployment Testing
- [ ] Frontend loads successfully
- [ ] File upload works on production
- [ ] Analysis returns correct results
- [ ] No CORS errors in browser console
- [ ] Sample datasets work on production
- [ ] Performance is acceptable
- [ ] Error messages are user-friendly

### 6.4 Monitoring & Debugging
- Check Render logs for build errors
- Monitor API response times
- Track file upload sizes and processing time
- Set up error logging/alerting (optional: Sentry, LogRocket)

---

## Phase 7: Optional Enhancements

### 7.1 Data Persistence
- Add database (PostgreSQL) to store analysis history
- Allow users to save/load previous analyses

### 7.2 Advanced Analysis
- Machine learning models (scikit-learn)
- Advanced statistical tests
- Custom formula support

### 7.3 UI/UX Improvements
- Dark mode toggle
- Data visualization themes
- Export to PDF/PowerPoint
- Batch file processing

### 7.4 Performance Optimization
- Cache analysis results
- Optimize large file handling
- Implement background job queue (Celery)
- Add frontend code splitting

### 7.5 Security
- Add user authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS enforcement

---

## Implementation Timeline

| Phase | Task | Est. Time |
|-------|------|-----------|
| 1 | Project setup & structure | 1-2 hours |
| 2 | Frontend development | 8-12 hours |
| 3 | Backend development | 6-10 hours |
| 4 | Deployment configuration | 2-3 hours |
| 5 | Testing & debugging | 4-6 hours |
| 6 | Render deployment & verification | 2-4 hours |
| **Total** | | **23-37 hours** |

---

## File Size & Performance Considerations

**Given Sample Data:**
- Small dataset: 325 bytes (minimal, instant processing)
- Large dataset: 113 KB (typical test size)

**Recommendations:**
- Support files up to 50MB initially
- Implement progress indicators for large files
- Consider chunked uploads for files >10MB
- Add timeout settings for long analysis operations

---

## Git Commit Strategy

```
Initial project setup
Create frontend skeleton
Implement file upload component
Implement data analysis API
Add visualization components
Configure Render deployment
Final testing and fixes
Ready for production
```

---

## Next Steps

1. ✅ Review and approve this PLAN.md
2. ⬜ Begin Phase 1: Project structure setup
3. ⬜ Implement Phase 2: Frontend
4. ⬜ Implement Phase 3: Backend
5. ⬜ Configure Phase 4: Render deployment
6. ⬜ Execute Phase 5: Testing
7. ⬜ Deploy Phase 6: Go live on Render
8. ⬜ Monitor Phase 7: Ongoing improvements

---

**Last Updated:** 2025-12-12
**Status:** Plan Document (Ready for Review)
