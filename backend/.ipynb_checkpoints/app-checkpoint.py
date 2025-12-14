from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
import uuid
import io
import json
import pandas as pd
import numpy as np
from scipy import stats
import logging
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Custom JSON encoder to handle NaN and Inf
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.floating, float)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        return super().default(obj)

# Initialize FastAPI app
app = FastAPI(
    title="Stats React API",
    description="Statistical Analysis API",
    version="0.1.0"
)

# Configure CORS
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files from frontend build
static_dir = Path(__file__).parent.parent / "frontend" / "dist"
if static_dir.exists():
    # Mount static assets (JS, CSS, images, etc.)
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    logger.info(f"Mounted static files from {static_dir}")

# In-memory storage for uploaded files (in production, use database or file storage)
uploaded_files = {}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Stats React API"}

@app.get("/api/sample-data")
async def list_sample_data():
    """List available sample datasets"""
    sample_dir = Path(__file__).parent.parent / "sample_data"

    if not sample_dir.exists():
        return {"samples": []}

    samples = []
    for file_path in sample_dir.glob("*"):
        if file_path.suffix.lower() in ['.csv', '.xlsx', '.xls']:
            samples.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "type": "CSV" if file_path.suffix.lower() == '.csv' else "Excel"
            })

    return {"samples": samples}

@app.post("/api/load-sample/{filename}")
async def load_sample_data(filename: str):
    """Load a sample dataset"""
    sample_dir = Path(__file__).parent.parent / "sample_data"
    file_path = sample_dir / filename

    # Security: prevent directory traversal
    if not file_path.resolve().is_relative_to(sample_dir.resolve()):
        raise HTTPException(status_code=400, detail="Invalid filename")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample file not found")

    if file_path.suffix.lower() not in ['.csv', '.xlsx', '.xls']:
        raise HTTPException(status_code=400, detail="Invalid file type")

    try:
        # Read the file
        with open(file_path, 'rb') as f:
            contents = f.read()

        file_obj = io.BytesIO(contents)

        # Load dataframe based on file type
        if filename.endswith('.csv'):
            df = pd.read_csv(file_obj)
        else:
            df = pd.read_excel(file_obj)

        # Validate dataframe
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")

        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="File has no columns")

        # Replace NaN and Inf values for JSON serialization
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notna(df), None)

        # Generate file ID
        file_id = str(uuid.uuid4())

        # Store file info
        uploaded_files[file_id] = {
            'dataframe': df,
            'filename': filename,
            'rows': len(df),
            'columns': list(df.columns),
        }

        # Prepare preview (first 5 and last 5 rows)
        if len(df) <= 10:
            preview_df = df
        else:
            preview_df = pd.concat([df.head(5), df.tail(5)])

        preview = []
        for _, row in preview_df.iterrows():
            row_data = []
            for val in row:
                if pd.isna(val):
                    row_data.append(None)
                elif isinstance(val, (float, np.floating)):
                    if np.isinf(val):
                        row_data.append(None)
                    else:
                        row_data.append(round(val, 4))
                elif isinstance(val, (int, np.integer)):
                    row_data.append(int(val))
                else:
                    row_data.append(str(val))
            preview.append(row_data)

        logger.info(f"Sample data loaded: {filename} ({file_id})")

        return {
            "file_id": file_id,
            "filename": filename,
            "rows": len(df),
            "columns": list(df.columns),
            "preview": preview,
            "dtypes": {col: str(df[col].dtype) for col in df.columns}
        }

    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="File is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Invalid file format")
    except Exception as e:
        logger.error(f"Error loading sample data: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file for analysis"""
    try:
        logger.info(f"Received file upload: {file.filename}, size: {file.size}, content_type: {file.content_type}")

        # Validate file type by extension
        filename_lower = file.filename.lower() if file.filename else ""
        if not (filename_lower.endswith('.csv') or filename_lower.endswith('.xlsx') or filename_lower.endswith('.xls')):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")

        # Read file into memory
        contents = await file.read()
        file_obj = io.BytesIO(contents)

        # Load dataframe based on file type
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_obj)
        else:
            df = pd.read_excel(file_obj)

        # Validate dataframe
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")

        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="File has no columns")

        # Replace NaN and Inf values for JSON serialization
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notna(df), None)

        # Generate file ID
        file_id = str(uuid.uuid4())

        # Store file info
        uploaded_files[file_id] = {
            'dataframe': df,
            'filename': file.filename,
            'rows': len(df),
            'columns': list(df.columns),
        }

        # Prepare preview (first 5 and last 5 rows) - convert to safe JSON-serializable format
        if len(df) <= 10:
            preview_df = df
        else:
            preview_df = pd.concat([df.head(5), df.tail(5)])

        preview = []
        for _, row in preview_df.iterrows():
            row_data = []
            for val in row:
                if pd.isna(val):
                    row_data.append(None)
                elif isinstance(val, (float, np.floating)):
                    if np.isinf(val):
                        row_data.append(None)
                    else:
                        row_data.append(round(val, 4))
                elif isinstance(val, (int, np.integer)):
                    row_data.append(int(val))
                else:
                    row_data.append(str(val))
            preview.append(row_data)

        logger.info(f"File uploaded: {file.filename} ({file_id})")

        return {
            "file_id": file_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "preview": preview,
            "dtypes": {col: str(df[col].dtype) for col in df.columns}
        }

    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="File is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Invalid file format")
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@app.post("/api/analyze")
async def analyze_data(request_data: dict = Body(...)):
    """Perform statistical analysis on uploaded data"""
    try:
        logger.info(f"Analyze request: {request_data}")

        file_id = request_data.get('file_id')
        analysis_type = request_data.get('analysis_type', 'descriptive')
        columns = request_data.get('columns', [])

        # Validate file_id
        if file_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="File not found")

        df = uploaded_files[file_id]['dataframe']

        # Validate columns
        if not columns:
            raise HTTPException(status_code=400, detail="No columns specified")

        # Filter to only numeric columns that exist
        numeric_columns = [col for col in columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]

        if not numeric_columns:
            raise HTTPException(status_code=400, detail="No valid numeric columns found")

        # Perform analysis based on type
        if analysis_type == 'descriptive':
            results = perform_descriptive_analysis(df, numeric_columns)
        elif analysis_type == 'correlation':
            results = perform_correlation_analysis(df, numeric_columns)
        elif analysis_type == 'distribution':
            results = perform_distribution_analysis(df, numeric_columns)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown analysis type: {analysis_type}")

        logger.info(f"Analysis completed: {analysis_type} for {len(numeric_columns)} columns")

        return {
            "analysis_type": analysis_type,
            "columns_analyzed": numeric_columns,
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing analysis: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error performing analysis: {str(e)}")

def safe_float(val):
    """Convert value to float, handling NaN and Inf"""
    if pd.isna(val) or np.isnan(val):
        return None
    if np.isinf(val):
        return None
    return float(val)

def perform_descriptive_analysis(df, columns):
    """Calculate descriptive statistics"""
    results = {}
    for col in columns:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue
        results[col] = {
            "count": int(col_data.count()),
            "mean": safe_float(col_data.mean()),
            "std": safe_float(col_data.std()),
            "min": safe_float(col_data.min()),
            "25%": safe_float(col_data.quantile(0.25)),
            "50%": safe_float(col_data.quantile(0.50)),
            "75%": safe_float(col_data.quantile(0.75)),
            "max": safe_float(col_data.max()),
        }
    return results

def perform_correlation_analysis(df, columns):
    """Calculate correlation matrix"""
    subset = df[columns].select_dtypes(include=[np.number])
    corr_matrix = subset.corr().fillna(0)

    # Convert to safe dict
    corr_dict = {}
    for col in corr_matrix.columns:
        corr_dict[str(col)] = {}
        for idx, val in corr_matrix[col].items():
            corr_dict[str(col)][str(idx)] = safe_float(val)

    results = {
        "correlation_matrix": corr_dict,
        "columns": columns,
    }
    return results

def perform_distribution_analysis(df, columns):
    """Analyze data distribution"""
    results = {}
    for col in columns:
        col_data = df[col].dropna()
        if len(col_data) < 3:  # Shapiro-Wilk requires at least 3 samples
            continue

        try:
            # Perform Shapiro-Wilk test for normality (sample up to 5000 points)
            sample_data = col_data.sample(min(5000, len(col_data)))
            _, p_value = stats.shapiro(sample_data)

            results[col] = {
                "skewness": safe_float(stats.skew(col_data)),
                "kurtosis": safe_float(stats.kurtosis(col_data)),
                "shapiro_p_value": safe_float(p_value),
                "is_normal": bool(p_value > 0.05),
            }
        except Exception as e:
            logger.warning(f"Could not analyze distribution for {col}: {str(e)}")
            continue

    return results

def is_date_type(series):
    """Check if a pandas Series contains date values"""
    if len(series.dropna()) == 0:
        return False

    # Try to parse as datetime
    try:
        non_null = series.dropna()
        # Sample up to 100 values for performance
        sample = non_null.sample(min(100, len(non_null)))
        parsed = pd.to_datetime(sample, errors='coerce')
        # If >90% of values parse successfully, consider it a date
        success_rate = parsed.notna().sum() / len(sample)
        return success_rate > 0.9
    except:
        return False

def is_numeric_type(series):
    """Check if a pandas Series contains numeric values"""
    if len(series.dropna()) == 0:
        return False

    # Check if already numeric dtype
    if pd.api.types.is_numeric_dtype(series):
        return True

    # Try to convert to numeric
    try:
        non_null = series.dropna()
        sample = non_null.sample(min(100, len(non_null)))
        converted = pd.to_numeric(sample, errors='coerce')
        # If >90% convert successfully, consider it numeric
        success_rate = converted.notna().sum() / len(sample)
        return success_rate > 0.9
    except:
        return False

def is_categorical_type(series, total_rows):
    """Check if a pandas Series should be categorical"""
    unique_count = series.nunique()
    threshold = min(total_rows * 0.5, 20)
    return unique_count < threshold

def detect_variable_type(series, total_rows):
    """Detect the most appropriate type for a variable"""
    # Check in order of specificity
    if is_date_type(series):
        return "date"
    elif is_numeric_type(series):
        return "numeric"
    elif is_categorical_type(series, total_rows):
        return "categorical"
    else:
        return "text"

def get_sample_values(series, n=5):
    """Get sample values from a series"""
    non_null = series.dropna()
    if len(non_null) == 0:
        return ["(all missing)"]

    # Get first few values
    sample_size = min(n, len(non_null))
    samples = non_null.head(sample_size).tolist()

    # Convert to strings
    return [str(val) for val in samples]

@app.post("/api/analyze-variables/{file_id}")
async def analyze_variables(file_id: str):
    """Analyze variables and detect data types"""
    try:
        # Validate file_id
        if file_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="File not found")

        df = uploaded_files[file_id]['dataframe']
        total_rows = len(df)

        variables = []
        for col in df.columns:
            series = df[col]

            # Calculate missingness
            missing_count = series.isna().sum()
            missing_percent = (missing_count / total_rows * 100) if total_rows > 0 else 0

            # Get unique count
            unique_count = series.nunique()

            # Detect type
            detected_type = detect_variable_type(series, total_rows)

            # Get sample values
            sample_values = get_sample_values(series, n=5)

            variables.append({
                "name": col,
                "detected_type": detected_type,
                "missingness": int(missing_count),
                "missingness_percent": round(missing_percent, 2),
                "unique_count": int(unique_count),
                "sample_values": sample_values,
                "total_count": total_rows
            })

        logger.info(f"Variable analysis completed for {file_id}: {len(variables)} variables")

        return {
            "file_id": file_id,
            "variables": variables
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing variables: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error analyzing variables: {str(e)}")

@app.get("/favicon.svg")
async def favicon_svg():
    """Serve the favicon SVG"""
    static_dir = Path(__file__).parent.parent / "frontend" / "dist"
    favicon_file = static_dir / "favicon.svg"

    if favicon_file.exists():
        return FileResponse(str(favicon_file), media_type="image/svg+xml")
    else:
        raise HTTPException(status_code=404, detail="Favicon not found")

@app.get("/favicon.ico")
async def favicon_ico():
    """Serve favicon.ico (redirect to SVG)"""
    static_dir = Path(__file__).parent.parent / "frontend" / "dist"
    favicon_file = static_dir / "favicon.svg"

    if favicon_file.exists():
        return FileResponse(str(favicon_file), media_type="image/svg+xml")
    else:
        raise HTTPException(status_code=404, detail="Favicon not found")

@app.get("/")
async def root():
    """Serve the frontend application"""
    static_dir = Path(__file__).parent.parent / "frontend" / "dist"
    index_file = static_dir / "index.html"

    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        # Fallback to API info if frontend not built
        return {
            "message": "Stats React API",
            "endpoints": {
                "health": "/api/health",
                "upload": "/api/upload",
                "analyze": "/api/analyze",
            }
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
