# Stats React - Statistical Analysis Web Application

A full-stack web application for statistical analysis where users can upload data files (CSV/Excel) and perform various statistical analyses.

## Features

- **File Upload**: Upload CSV and Excel files
- **Data Preview**: View uploaded data in a table format
- **Statistical Analysis**:
  - Descriptive Statistics (mean, median, std dev, quartiles)
  - Correlation Matrix (Pearson correlation)
  - Distribution Analysis (skewness, kurtosis, normality tests)
- **Clean UI**: Modern, responsive web interface
- **Production Ready**: Configured for deployment on Render.com

## Project Structure

```
Medstat/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   └── styles/       # CSS styles
│   ├── vite.config.js
│   └── package.json
├── backend/              # FastAPI Python backend
│   ├── app.py           # Main application
│   └── requirements.txt
├── sample_data/         # Sample datasets for testing
│   ├── small_dataset.csv
│   └── large_dataset.xlsx
├── render.yaml          # Render deployment config
└── PLAN.md             # Development plan
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **CSS3** - Styling

### Backend
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pandas** - Data processing
- **NumPy** - Numerical computing
- **SciPy** - Statistical functions

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- npm or yarn

### Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/CallMeTwo/Stat_app.git
cd Stat_app
```

#### 2. Start Backend Server

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend will run on `http://localhost:5000`

#### 3. Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

#### 4. Test with Sample Data

1. Open http://localhost:5173 in your browser
2. Upload `sample_data/small_dataset.csv` or `sample_data/large_dataset.xlsx`
3. View data preview
4. Run different analyses
5. View results

## API Endpoints

### Health Check
```
GET /api/health
Response: {"status": "ok", "service": "Stats React API"}
```

### File Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (CSV or XLSX)

Response:
{
  "file_id": "uuid",
  "filename": "data.csv",
  "rows": 100,
  "columns": ["col1", "col2"],
  "preview": [[...], [...]]
}
```

### Data Analysis
```
POST /api/analyze
Content-Type: application/json
Body: {
  "file_id": "uuid",
  "analysis_type": "descriptive|correlation|distribution",
  "columns": ["col1", "col2"]
}

Response:
{
  "analysis_type": "descriptive",
  "columns_analyzed": ["col1"],
  "results": {
    "col1": {
      "count": 100,
      "mean": 50.5,
      "std": 10.2,
      ...
    }
  }
}
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000  # Development
```

### Backend (.env)
```
DEBUG=False
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
```

## Deployment on Render

### Prerequisites
1. GitHub account with the repository linked
2. Render.com account

### Deployment Steps

1. **Connect GitHub Repository**
   - Go to Render.com
   - Create new service
   - Connect your GitHub repository

2. **Configure Services**
   - The `render.yaml` file defines both frontend and backend services
   - Render will automatically detect and configure services

3. **Set Environment Variables**
   - Frontend: `VITE_API_URL` (auto-configured)
   - Backend: `ALLOWED_ORIGINS` (will be set to frontend URL)

4. **Deploy**
   - Push to GitHub
   - Render automatically builds and deploys

5. **Monitor**
   - Check Render dashboard for build logs
   - Verify both services are running
   - Test endpoints

## Sample Data

### small_dataset.csv
A small health metrics dataset with 325 bytes containing:
- age, height, weight, gender, blood_pressure, cholesterol, active

### large_dataset.xlsx
A larger dataset (113 KB) for comprehensive testing

## Development Workflow

1. **Frontend Development**
   - Components are in `frontend/src/components/`
   - Styles are in `frontend/src/styles/`
   - API calls through `frontend/src/services/api.js`

2. **Backend Development**
   - API routes in `backend/app.py`
   - Analysis functions: `perform_descriptive_analysis()`, etc.
   - Add new endpoints for new features

3. **Testing**
   - Test with sample datasets
   - Check browser console for frontend errors
   - Check server logs for backend errors

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` in backend includes frontend URL
- Check vite.config.js proxy settings

### File Upload Issues
- Verify file is CSV or Excel format
- Check file size (max 50MB)
- Look at backend logs for specific errors

### Analysis Errors
- Ensure selected columns are numeric
- Check that columns actually exist in the data
- Review backend logs for error details

## Performance Optimization

For production:
1. Enable caching for uploaded files (use database)
2. Implement background job queue for large analyses
3. Add result caching
4. Optimize bundle size with code splitting

## Security Considerations

1. **Input Validation**: All file uploads are validated
2. **CORS**: Configured for specific origins
3. **File Size Limits**: 50MB max file size
4. **Error Handling**: Generic error messages for security

For production:
- Add authentication/authorization
- Implement rate limiting
- Add request validation
- Use HTTPS
- Sanitize file uploads

## Future Enhancements

- [ ] User authentication
- [ ] Persistent data storage (database)
- [ ] Advanced visualizations (Plotly, D3.js)
- [ ] Machine learning models
- [ ] Export results (PDF, Excel)
- [ ] Batch file processing
- [ ] Real-time collaboration

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

---

**Last Updated**: 2025-12-12
**Status**: Ready for Development & Deployment
