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
    """Check if a pandas Series contains date values using pattern matching"""
    import re

    if len(series.dropna()) == 0:
        return False

    # Skip if already numeric dtype (prevent numeric values from being detected as dates)
    if pd.api.types.is_numeric_dtype(series):
        return False

    # Common date patterns
    date_patterns = [
        r'^\d{4}[-/]\d{1,2}[-/]\d{1,2}',  # YYYY-MM-DD or YYYY/MM/DD
        r'^\d{1,2}[-/]\d{1,2}[-/]\d{4}',  # DD-MM-YYYY or MM-DD-YYYY
        r'^\d{1,2}[-/]\d{1,2}[-/]\d{2}',  # DD-MM-YY or MM-DD-YY
        r'^\d{4}\d{2}\d{2}$',              # YYYYMMDD
        r'^\w{3}\s+\d{1,2},?\s+\d{4}',    # Mon DD, YYYY or Mon DD YYYY
        r'^\d{1,2}\s+\w{3}\s+\d{4}',      # DD Mon YYYY
    ]

    try:
        non_null = series.dropna().astype(str)
        # Sample up to 100 values for performance
        sample = non_null.sample(min(100, len(non_null)))

        matches = 0
        for value in sample:
            # Check if value matches any date pattern
            for pattern in date_patterns:
                if re.match(pattern, value.strip()):
                    matches += 1
                    break

        # If >80% of values match date patterns, consider it a date
        success_rate = matches / len(sample)
        return success_rate > 0.8
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
    # 1. Date - specific pattern matching
    if is_date_type(series):
        return "date"
    # 2. Categorical - check before numeric to catch coded categories (1,2,3)
    elif is_categorical_type(series, total_rows):
        return "categorical"
    # 3. Numeric - continuous numbers
    elif is_numeric_type(series):
        return "numeric"
    # 4. Text - fallback
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

def compute_numeric_summary(series):
    """Calculate summary statistics for numeric variables"""
    non_null = series.dropna()

    if len(non_null) == 0:
        return {
            "mean": None,
            "sd": None,
            "median": None,
            "q1": None,
            "q3": None,
            "min": None,
            "max": None,
            "missing_count": int(series.isna().sum()),
            "missing_percent": 100.0,
            "kurtosis": None,
            "skewness": None,
            "shapiro_stat": None,
            "shapiro_p": None,
            "jb_stat": None,
            "jb_p": None
        }

    # Convert to numeric if needed
    if not pd.api.types.is_numeric_dtype(non_null):
        non_null = pd.to_numeric(non_null, errors='coerce').dropna()

    if len(non_null) == 0:
        return {
            "mean": None,
            "sd": None,
            "median": None,
            "q1": None,
            "q3": None,
            "min": None,
            "max": None,
            "missing_count": int(series.isna().sum()),
            "missing_percent": round((series.isna().sum() / len(series) * 100), 2),
            "kurtosis": None,
            "skewness": None,
            "shapiro_stat": None,
            "shapiro_p": None,
            "jb_stat": None,
            "jb_p": None
        }

    missing_count = series.isna().sum()
    missing_percent = (missing_count / len(series) * 100)

    # Basic statistics
    result = {
        "mean": safe_float(non_null.mean()),
        "sd": safe_float(non_null.std()),
        "median": safe_float(non_null.median()),
        "q1": safe_float(non_null.quantile(0.25)),
        "q3": safe_float(non_null.quantile(0.75)),
        "min": safe_float(non_null.min()),
        "max": safe_float(non_null.max()),
        "missing_count": int(missing_count),
        "missing_percent": round(missing_percent, 2),
        "kurtosis": safe_float(stats.kurtosis(non_null)),
        "skewness": safe_float(stats.skew(non_null))
    }

    # Shapiro-Wilk test (requires 3-5000 samples)
    if 3 <= len(non_null) <= 5000:
        try:
            shapiro_stat, shapiro_p = stats.shapiro(non_null)
            result["shapiro_stat"] = safe_float(shapiro_stat)
            result["shapiro_p"] = safe_float(shapiro_p)
        except:
            result["shapiro_stat"] = None
            result["shapiro_p"] = None
    elif len(non_null) > 5000:
        # Sample for large datasets
        try:
            sample = non_null.sample(5000)
            shapiro_stat, shapiro_p = stats.shapiro(sample)
            result["shapiro_stat"] = safe_float(shapiro_stat)
            result["shapiro_p"] = safe_float(shapiro_p)
        except:
            result["shapiro_stat"] = None
            result["shapiro_p"] = None
    else:
        result["shapiro_stat"] = None
        result["shapiro_p"] = None

    # Jarque-Bera test
    try:
        jb_stat, jb_p = stats.jarque_bera(non_null)
        result["jb_stat"] = safe_float(jb_stat)
        result["jb_p"] = safe_float(jb_p)
    except:
        result["jb_stat"] = None
        result["jb_p"] = None

    return result

def compute_categorical_summary(series):
    """Calculate summary statistics for categorical variables"""
    missing_count = series.isna().sum()
    missing_percent = (missing_count / len(series) * 100)

    # Count unique classes
    unique_count = series.nunique()

    # Create frequency table
    value_counts = series.value_counts()
    total_non_missing = len(series) - missing_count

    frequency_table = []
    for class_name, count in value_counts.items():
        percentage = (count / total_non_missing * 100) if total_non_missing > 0 else 0
        frequency_table.append({
            "name": str(class_name),
            "count": int(count),
            "percentage": round(percentage, 2)
        })

    return {
        "unique_count": int(unique_count),
        "missing_count": int(missing_count),
        "missing_percent": round(missing_percent, 2),
        "frequency_table": frequency_table
    }

def compute_date_summary(series, rounding='year'):
    """Calculate summary statistics for date variables"""
    import re

    missing_count = series.isna().sum()
    missing_percent = (missing_count / len(series) * 100)

    non_null = series.dropna()

    if len(non_null) == 0:
        return {
            "min_date": None,
            "max_date": None,
            "missing_count": int(missing_count),
            "missing_percent": round(missing_percent, 2),
            "frequency_table": []
        }

    # Try to parse dates
    try:
        dates = pd.to_datetime(non_null, errors='coerce')
        dates = dates.dropna()

        if len(dates) == 0:
            return {
                "min_date": None,
                "max_date": None,
                "missing_count": int(missing_count),
                "missing_percent": round(missing_percent, 2),
                "frequency_table": []
            }

        # Round dates based on option
        if rounding == 'year':
            rounded_dates = dates.dt.to_period('Y').astype(str)
        elif rounding == 'month':
            rounded_dates = dates.dt.to_period('M').astype(str)
        elif rounding == 'week':
            rounded_dates = dates.dt.to_period('W').astype(str)
        else:  # day
            rounded_dates = dates.dt.date.astype(str)

        # Create frequency table
        value_counts = rounded_dates.value_counts()
        total_count = len(rounded_dates)

        frequency_table = []
        for date_str, count in value_counts.items():
            percentage = (count / total_count * 100) if total_count > 0 else 0
            frequency_table.append({
                "name": str(date_str),
                "count": int(count),
                "percentage": round(percentage, 2)
            })

        return {
            "min_date": str(dates.min().date()),
            "max_date": str(dates.max().date()),
            "missing_count": int(missing_count),
            "missing_percent": round(missing_percent, 2),
            "frequency_table": frequency_table
        }
    except Exception as e:
        logger.warning(f"Error computing date summary: {str(e)}")
        return {
            "min_date": None,
            "max_date": None,
            "missing_count": int(missing_count),
            "missing_percent": round(missing_percent, 2),
            "frequency_table": []
        }

def compute_text_summary(series, seed=None):
    """Calculate summary statistics for text variables"""
    missing_count = series.isna().sum()
    missing_percent = (missing_count / len(series) * 100)

    non_null = series.dropna()

    if len(non_null) == 0:
        return {
            "missing_count": int(missing_count),
            "missing_percent": round(missing_percent, 2),
            "samples": []
        }

    # Get random samples
    sample_size = min(5, len(non_null))
    if seed is not None:
        samples = non_null.sample(n=sample_size, random_state=seed)
    else:
        samples = non_null.sample(n=sample_size)

    return {
        "missing_count": int(missing_count),
        "missing_percent": round(missing_percent, 2),
        "samples": [str(s) for s in samples.tolist()]
    }

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

@app.post("/api/summary-statistics/{file_id}")
async def get_summary_statistics(file_id: str, request_data: dict = Body(...)):
    """Get summary statistics for each variable based on its type"""
    try:
        # Validate file_id
        if file_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="File not found")

        df = uploaded_files[file_id]['dataframe']

        # Get variables with their types from request
        variables = request_data.get('variables', [])
        date_rounding = request_data.get('dateRounding', {})
        text_seed = request_data.get('textSeed', 42)

        if not variables:
            raise HTTPException(status_code=400, detail="No variables specified")

        summaries = {}

        for var in variables:
            var_name = var.get('name')
            var_type = var.get('currentType')

            if var_name not in df.columns:
                logger.warning(f"Variable {var_name} not found in dataframe")
                continue

            series = df[var_name]

            # Compute summary based on type
            if var_type == 'numeric':
                summary = compute_numeric_summary(series)
                summary['type'] = 'numeric'
            elif var_type == 'categorical':
                summary = compute_categorical_summary(series)
                summary['type'] = 'categorical'
            elif var_type == 'date':
                rounding = date_rounding.get(var_name, 'day')
                summary = compute_date_summary(series, rounding)
                summary['type'] = 'date'
            elif var_type == 'text':
                summary = compute_text_summary(series, text_seed)
                summary['type'] = 'text'
            else:
                logger.warning(f"Unknown type {var_type} for variable {var_name}")
                continue

            summaries[var_name] = summary

        logger.info(f"Summary statistics computed for {file_id}: {len(summaries)} variables")

        return {
            "file_id": file_id,
            "summaries": summaries
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing summary statistics: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error computing summary statistics: {str(e)}")

@app.post("/api/summary-statistics/{file_id}/{variable_name}")
async def get_single_variable_summary(file_id: str, variable_name: str, request_data: dict = Body(...)):
    """Get summary statistics for a single variable - optimized for single-variable updates"""
    try:
        # Validate file_id
        if file_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="File not found")

        df = uploaded_files[file_id]['dataframe']

        # Validate variable exists
        if variable_name not in df.columns:
            raise HTTPException(status_code=404, detail=f"Variable '{variable_name}' not found")

        # Get variable type and parameters
        var_type = request_data.get('varType')
        rounding = request_data.get('rounding', 'year')  # For date variables
        seed = request_data.get('seed', 42)  # For text variables

        if not var_type:
            raise HTTPException(status_code=400, detail="Variable type (varType) is required")

        series = df[variable_name]

        # Compute summary based on type
        if var_type == 'numeric':
            summary = compute_numeric_summary(series)
            summary['type'] = 'numeric'
        elif var_type == 'categorical':
            summary = compute_categorical_summary(series)
            summary['type'] = 'categorical'
        elif var_type == 'date':
            summary = compute_date_summary(series, rounding)
            summary['type'] = 'date'
        elif var_type == 'text':
            summary = compute_text_summary(series, seed)
            summary['type'] = 'text'
        else:
            raise HTTPException(status_code=400, detail=f"Unknown variable type: {var_type}")

        logger.info(f"Single variable summary computed for {file_id}/{variable_name} (type: {var_type})")

        return {
            "file_id": file_id,
            "variable_name": variable_name,
            "summary": summary
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing single variable summary: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error computing summary: {str(e)}")

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
