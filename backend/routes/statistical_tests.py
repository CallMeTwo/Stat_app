from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import pandas as pd
from pathlib import Path
import json
from services.test_runner import (
    run_ttest,
    run_paired_ttest,
    run_anova,
    run_mann_whitney,
    run_wilcoxon_signed_rank,
    run_kruskal_wallis,
    run_chi_square,
    run_pearson_correlation,
    run_spearman_correlation,
    run_kendall_correlation
)

router = APIRouter(prefix="/api/statistical-tests", tags=["statistical-tests"])

# Request models
class StatisticalTestRequest(BaseModel):
    file_id: str
    variables: Dict[str, str]

# Helper function to load file data
# Import from app to access uploaded_files dictionary
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

@router.post("/ttest")
async def ttest(request: StatisticalTestRequest):
    """Independent samples t-test"""
    try:
        if not request.variables.get('numeric') or not request.variables.get('categorical'):
            raise HTTPException(status_code=400, detail='Missing required variables: numeric and categorical')

        file_data = load_file_data(request.file_id)
        results = run_ttest(file_data, request.variables['numeric'], request.variables['categorical'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/paired-ttest")
async def paired_ttest(request: StatisticalTestRequest):
    """Paired samples t-test"""
    try:
        if not request.variables.get('var1') or not request.variables.get('var2'):
            raise HTTPException(status_code=400, detail='Missing required variables: var1 and var2')

        file_data = load_file_data(request.file_id)
        results = run_paired_ttest(file_data, request.variables['var1'], request.variables['var2'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/anova")
async def anova(request: StatisticalTestRequest):
    """One-way ANOVA"""
    try:
        if not request.variables.get('numeric') or not request.variables.get('categorical'):
            raise HTTPException(status_code=400, detail='Missing required variables: numeric and categorical')

        file_data = load_file_data(request.file_id)
        results = run_anova(file_data, request.variables['numeric'], request.variables['categorical'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mann-whitney")
async def mann_whitney(request: StatisticalTestRequest):
    """Mann-Whitney U test (Wilcoxon Rank Sum)"""
    try:
        if not request.variables.get('numeric') or not request.variables.get('categorical'):
            raise HTTPException(status_code=400, detail='Missing required variables: numeric and categorical')

        file_data = load_file_data(request.file_id)
        results = run_mann_whitney(file_data, request.variables['numeric'], request.variables['categorical'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wilcoxon-signed-rank")
async def wilcoxon_signed_rank(request: StatisticalTestRequest):
    """Wilcoxon Signed-Rank test"""
    try:
        if not request.variables.get('var1') or not request.variables.get('var2'):
            raise HTTPException(status_code=400, detail='Missing required variables: var1 and var2')

        file_data = load_file_data(request.file_id)
        results = run_wilcoxon_signed_rank(file_data, request.variables['var1'], request.variables['var2'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kruskal-wallis")
async def kruskal_wallis(request: StatisticalTestRequest):
    """Kruskal-Wallis test"""
    try:
        if not request.variables.get('numeric') or not request.variables.get('categorical'):
            raise HTTPException(status_code=400, detail='Missing required variables: numeric and categorical')

        file_data = load_file_data(request.file_id)
        results = run_kruskal_wallis(file_data, request.variables['numeric'], request.variables['categorical'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chi-square")
async def chi_square(request: StatisticalTestRequest):
    """Chi-Square test"""
    try:
        if not request.variables.get('var1') or not request.variables.get('var2'):
            raise HTTPException(status_code=400, detail='Missing required variables: var1 and var2')

        file_data = load_file_data(request.file_id)
        results = run_chi_square(file_data, request.variables['var1'], request.variables['var2'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pearson-correlation")
async def pearson_correlation(request: StatisticalTestRequest):
    """Pearson Correlation"""
    try:
        if not request.variables.get('var1') or not request.variables.get('var2'):
            raise HTTPException(status_code=400, detail='Missing required variables: var1 and var2')

        file_data = load_file_data(request.file_id)
        results = run_pearson_correlation(file_data, request.variables['var1'], request.variables['var2'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/spearman-correlation")
async def spearman_correlation(request: StatisticalTestRequest):
    """Spearman Correlation"""
    try:
        if not request.variables.get('var1') or not request.variables.get('var2'):
            raise HTTPException(status_code=400, detail='Missing required variables: var1 and var2')

        file_data = load_file_data(request.file_id)
        results = run_spearman_correlation(file_data, request.variables['var1'], request.variables['var2'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kendall-correlation")
async def kendall_correlation(request: StatisticalTestRequest):
    """Kendall Correlation (Tau)"""
    try:
        if not request.variables.get('var1') or not request.variables.get('var2'):
            raise HTTPException(status_code=400, detail='Missing required variables: var1 and var2')

        file_data = load_file_data(request.file_id)
        results = run_kendall_correlation(file_data, request.variables['var1'], request.variables['var2'])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
