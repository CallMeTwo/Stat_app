# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Medstat** is a full-stack statistical analysis web application that allows users to upload data files (CSV/Excel) and perform various statistical analyses, tests, and regressions with an interactive UI.

- **Frontend**: React 18 + Vite + Recharts
- **Backend**: FastAPI + Python (pandas, scipy, scikit-learn, statsmodels)
- **Deployment**: Docker-based (Render.com ready via render.yaml)

## Essential Development Commands

### Backend (Python/FastAPI)

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server (with auto-reload)
uvicorn app:app --reload
# Server runs on http://localhost:5000

# Run a single statistical test module (for debugging)
python -m services.test_runner
```

### Frontend (React/Vite)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
# Server runs on http://localhost:5173 with API proxy to backend

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Full Stack Development

Use the provided shell scripts:
```bash
./start-backend.sh   # In separate terminal
./start-frontend.sh  # In separate terminal
```

## Architecture Overview

### Backend Structure

**Main App (`backend/app.py`)**
- Entry point for FastAPI application
- Handles file upload and in-memory storage (uploaded_files dict)
- Core API endpoints:
  - `/api/upload` - POST file upload (CSV/Excel)
  - `/api/load-sample/{filename}` - Load sample datasets
  - `/api/analyze-variables/{file_id}` - Variable type detection and analysis
  - `/api/summary-statistics/{file_id}` - Compute statistics by variable type
  - `/api/data/{file_id}` - Get raw data for frontend visualization
- Variable type detection logic: `detect_variable_type()` classifies columns as numeric/categorical/date/text
- Summary computation functions for each type: `compute_numeric_summary()`, `compute_categorical_summary()`, etc.

**Statistical Tests Router (`backend/routes/statistical_tests.py`)**
- Handles requests for parametric and non-parametric tests
- Available tests: t-test, paired t-test, ANOVA, Mann-Whitney, Wilcoxon, Kruskal-Wallis, Chi-square, correlations (Pearson/Spearman/Kendall)
- Delegates to `services.test_runner` module for actual computations

**Regression Router (`backend/routes/regression.py`)**
- Handles linear and logistic regression requests
- Delegates to `services.regression_runner` module

**Services**
- `services/test_runner.py` - Statistical test implementations using scipy/statsmodels
- `services/regression_runner.py` - Regression implementations using sklearn

### Frontend Structure

**Core App (`frontend/src/App.jsx`)**
- Main routing component using react-router-dom
- Routes to different pages: FileUpload, Analysis, Regression, Visualization

**Main Components**
- `FileUpload.jsx` - File upload UI and sample data loader
- `DataSummary.jsx` - Displays variable list, types, and summary statistics
- `DataTypeValidation.jsx` - Variable type review and editing before analysis
- `Analysis.jsx` - Interface for running statistical tests
- `Regression.jsx` - Interface for running regression analyses
- `Visualization.jsx` - Interactive charts using Recharts

**Chart Components** (`frontend/src/components/charts/`)
- `HistogramChart.jsx` - Histogram with customizable bins
- `BoxChart.jsx` - Box plots
- `DensityChart.jsx` - Density/distribution curves
- `ScatterChart.jsx` - Scatter plots
- `BarChartComponent.jsx` - Bar charts for categorical data
- `MeanCIChart.jsx` - Mean and confidence interval plots

**API Service** (`frontend/src/services/api.js`)
- Centralized axios client for all backend communication
- Methods for upload, analysis, regression, visualization endpoints

### Data Flow

1. **File Upload**: User uploads CSV/Excel → `POST /api/upload` → DataFrame stored in memory with unique file_id
2. **Variable Analysis**: Frontend requests `/api/analyze-variables/{file_id}` → Backend detects types (numeric/categorical/date/text)
3. **Type Validation**: Frontend shows `DataTypeValidation` component → User can override detected types
4. **Summary Statistics**: Frontend requests `/api/summary-statistics/{file_id}` with variable type info → Backend computes type-specific statistics
5. **Analysis**: User selects test and variables → Frontend sends to appropriate test endpoint → Results displayed in `TestResults` component
6. **Visualization**: Raw data fetched from `/api/data/{file_id}` → Frontend transforms and renders with Recharts

## Variable Type Detection

The backend automatically detects variable types but allows frontend override:

- **numeric**: Continuous numbers (float/int with >90% convertible values). Gets mean, sd, quantiles, distribution tests.
- **categorical**: Unique values ≤50% of rows or ≤20 unique values. Gets frequency table.
- **date**: Pattern matching for common date formats (YYYY-MM-DD, DD-MM-YYYY, ISO strings). Gets min/max date.
- **text**: All other string data. Gets all raw values for frontend sampling.

Key functions in `app.py`:
- `detect_variable_type()` - Main classification logic
- `compute_numeric_summary()` - Includes Shapiro-Wilk and Jarque-Bera tests
- `compute_categorical_summary()` - Frequency tables
- `compute_date_summary()` - Date range and ISO strings
- `compute_text_summary()` - Raw values

## Important Files and Locations

**Configuration**
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies
- `frontend/vite.config.js` - Vite server config with API proxy to backend
- `render.yaml` - Render.com deployment configuration
- `Dockerfile` - Docker build configuration

**Sample Data**
- `sample_data/small_dataset.csv` - Small health metrics dataset
- `sample_data/large_dataset.xlsx` - Larger test dataset

**Environment Variables**
- `VITE_API_TARGET` (frontend) - Backend URL for API calls
- `PORT` (backend) - Server port (default 5000)
- `ALLOWED_ORIGINS` (backend) - CORS allowed origins
- `DEBUG` (backend) - Debug mode
- `LOG_LEVEL` (backend) - Logging level

## Common Development Tasks

**Adding a new statistical test:**
1. Implement the test function in `backend/services/test_runner.py`
2. Add the route handler to `backend/routes/statistical_tests.py`
3. Add UI controls in `frontend/src/components/TestTypeSelector.jsx` and `TestVariableSelectors.jsx`
4. Display results in `frontend/src/components/TestResults.jsx`

**Adding a new visualization:**
1. Create chart component in `frontend/src/components/charts/`
2. Import and use in `frontend/src/components/Visualization.jsx`
3. Pass data from `/api/data/{file_id}` endpoint

**Debugging data issues:**
- Backend logs go to stdout when `--reload` is active
- Frontend debug: Check browser console (F12)
- Test file loading with API endpoint: `POST /api/upload` with test file
- Check variable detection: Inspect `/api/analyze-variables/{file_id}` response

## Notes

- **In-memory storage**: Files are stored in `uploaded_files` dict in `app.py`. Not persistent; resets on server restart.
- **NaN/Inf handling**: Custom `NumpyEncoder` class handles JSON serialization of numpy types and special float values.
- **Large file handling**: Shapiro-Wilk test samples up to 5000 points for large datasets to avoid timeout.
- **Frontend proxy**: Vite dev server proxies all `/api/*` requests to backend, handling CORS automatically.
- **Test compatibility**: Many tests require specific variable types (e.g., t-test needs one numeric and one 2-level categorical).
