from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any
import pandas as pd
from services.regression_runner import (
    run_linear_regression,
    run_logistic_regression
)

router = APIRouter(prefix="/api/regression", tags=["regression"])

# Request models
class RegressionRequest(BaseModel):
    file_id: str
    variables: Dict[str, Any]  # {dependent: str, independent: List[str]}

# Helper function to load file data
def load_file_data(file_id: str):
    """Load data from uploaded file in memory"""
    from app import uploaded_files

    if file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail=f"File {file_id} not found")

    # Get dataframe and convert to list of dicts for processing
    df = uploaded_files[file_id]['dataframe']

    # Replace NaN with None for JSON serialization
    df = df.where(pd.notna(df), None)

    # Convert to list of dictionaries
    data = df.to_dict('records')

    return data

@router.post("/linear")
async def linear_regression(request: RegressionRequest):
    """Perform linear regression"""
    try:
        dependent_var = request.variables.get('dependent')
        independent_vars = request.variables.get('independent', [])

        if not dependent_var:
            raise HTTPException(status_code=400, detail='Missing required variable: dependent')

        if not independent_vars or len(independent_vars) == 0:
            raise HTTPException(status_code=400, detail='Missing required variables: independent (at least one)')

        file_data = load_file_data(request.file_id)
        results = run_linear_regression(file_data, dependent_var, independent_vars)

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logistic")
async def logistic_regression(request: RegressionRequest):
    """Perform logistic regression"""
    try:
        dependent_var = request.variables.get('dependent')
        independent_vars = request.variables.get('independent', [])

        if not dependent_var:
            raise HTTPException(status_code=400, detail='Missing required variable: dependent')

        if not independent_vars or len(independent_vars) == 0:
            raise HTTPException(status_code=400, detail='Missing required variables: independent (at least one)')

        file_data = load_file_data(request.file_id)
        results = run_logistic_regression(file_data, dependent_var, independent_vars)

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
