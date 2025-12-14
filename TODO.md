# Statistical Tests Analysis Page - Implementation Plan

## Overview
Rewrite the Analysis page to follow a similar flow to the Visualization page. Users will:
1. Select a statistical test type
2. Choose eligible variables based on test requirements
3. Send data to backend API for computation
4. Display test results below

---

## Test Types & Requirements

### Parametric Tests
1. **t-Test** (Independent samples)
   - Requirements: 1 numeric variable + 1 binary categorical variable
   - Output: N, mean, SD, 95% CI of mean (For each group), t-statistic, degrees of freedom, p-value, mean difference, 95% CI of difference

2. **Paired t-Test**
   - Requirements: 2 numeric variables
   - Output: N, mean, SD, 95% CI of mean (For each group), t-statistic, p-value, mean difference, 95% CI

3. **ANOVA** (One-way)
   - Requirements: 1 numeric variable + 1 categorical variable (≥2 classes)
   - Output: N, mean, SD, 95% CI of mean (For each group), between-group SS, within-group SS, F-statistic, p-value

### Non-parametric Tests
4. **Wilcoxon Rank Sum** (Mann-Whitney U)
   - Requirements: 1 numeric variable + 1 binary categorical variable
   - Output: Median of each groups, U-statistic, p-value, effect size (r)

5. **Wilcoxon Signed Rank**
   - Requirements: 2 numeric variables
   - Output: Median of each groups, W-statistic, p-value, effect size (r)

6. **Kruskal-Wallis**
   - Requirements: 1 numeric variable + 1 categorical variable
   - Output: H-statistic, p-value, mean ranks by group

### Categorical Tests
7. **Chi-Square** (Test of Independence)
   - Requirements: 2 categorical variables
   - Output: χ² statistic, p-value, degrees of freedom, contingency table

### Correlation Tests
8. **Pearson Correlation**
   - Requirements: 2 numeric variables
   - Output: correlation coefficient, p-value, 95% CI

9. **Spearman Correlation**
   - Requirements: 2 numeric variables
   - Output: correlation coefficient, p-value, 95% CI

10. **Kendall Correlation** (Tau)
    - Requirements: 2 numeric variables
    - Output: Kendall's tau, p-value

---

## Frontend Implementation

### Phase 1: Component Structure

#### 1.1 Create Analysis Component Hierarchy
```
Analysis.jsx (main page - similar to Visualization.jsx)
├── TestTypeSelector.jsx (test selection with descriptions)
├── VariableSelectors.jsx (dynamic variable dropdowns based on test type)
└── ResultsDisplay.jsx (display test results in readable format)
```

#### 1.2 Test Type Selector
- Grid/list of available tests with icons and descriptions
- Similar to PlotTypeSelector in Visualization
- Keyboard navigation support (arrow keys)
- Tab management similar to Visualization

#### 1.3 Variable Selectors (Dynamic)
- Render dropdowns based on selected test type
- Filter variables by type (numeric/categorical)
- For categorical: show number of classes
- For numeric: show data range/summary stats
- Show which variables meet test requirements
- "Run Test" button only enabled when all required variables selected

#### 1.4 Results Display
- Formatted results panel
- Test name + description
- Statistical output (table format for easy reading)
- P-value interpretation guide
- Effect size (when applicable)
- Assumptions check (normality, homogeneity, etc. if applicable)

### Phase 2: State Management

```jsx
const [selectedTest, setSelectedTest] = useState('')
const [selectedVars, setSelectedVars] = useState({})
const [testResults, setTestResults] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
```

### Phase 3: Test Configuration Mapping

```jsx
const testConfigs = {
  'ttest': {
    name: 't-Test (Independent)',
    description: 'Compare means of two independent groups',
    requirements: [
      { key: 'numeric', type: 'numeric', label: 'Numeric Variable', required: true },
      { key: 'categorical', type: 'categorical', label: 'Group Variable (Binary)', required: true, minClasses: 2, maxClasses: 2 }
    ],
    endpoint: '/api/statistical-tests/ttest'
  },
  'paired_ttest': {
    name: 'Paired t-Test',
    description: 'Compare means of two paired/dependent groups',
    requirements: [
      { key: 'var1', type: 'numeric', label: 'First Variable', required: true },
      { key: 'var2', type: 'numeric', label: 'Second Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/paired-ttest'
  },
  // ... etc for all 10 tests
}
```

---

## Backend Implementation

### API Endpoint Structure
```
POST /api/statistical-tests/{test_type}
{
  "file_id": "...",
  "variables": {
    "numeric": "column_name" or ["col1", "col2"],
    "categorical": "column_name"
  }
}
```

### Response Format Examples

#### t-Test (Independent)
```json
{
  "test_name": "t-Test (Independent)",
  "test_type": "ttest",
  "statistics": {
    "t_statistic": 2.354,
    "p_value": 0.0234,
    "df": 48,
    "mean_diff": 5.2,
    "ci_lower": 0.8,
    "ci_upper": 9.6
  },
  "groups": {
    "Group1": { "n": 25, "mean": 50.3, "std": 8.2, "ci_mean_lower": 46.5, "ci_mean_upper": 54.1 },
    "Group2": { "n": 25, "mean": 45.1, "std": 7.9, "ci_mean_lower": 41.5, "ci_mean_upper": 48.7 }
  },
  "assumptions": {
    "normality": { "method": "Shapiro-Wilk", "p_value": 0.234, "passed": true },
    "homogeneity": { "method": "Levene", "p_value": 0.456, "passed": true }
  },
  "interpretation": "Significant difference detected (p < 0.05)"
}
```

#### Paired t-Test
```json
{
  "test_name": "Paired t-Test",
  "test_type": "paired_ttest",
  "statistics": {
    "t_statistic": 3.125,
    "p_value": 0.0045,
    "df": 24,
    "mean_diff": 2.8,
    "ci_lower": 1.2,
    "ci_upper": 4.4
  },
  "pairs": {
    "Var1": { "n": 25, "mean": 52.1, "std": 8.5, "ci_mean_lower": 48.1, "ci_mean_upper": 56.1 },
    "Var2": { "n": 25, "mean": 49.3, "std": 7.9, "ci_mean_lower": 45.6, "ci_mean_upper": 53.0 }
  },
  "assumptions": {
    "normality_of_differences": { "method": "Shapiro-Wilk", "p_value": 0.189, "passed": true }
  },
  "interpretation": "Significant difference detected (p < 0.05)"
}
```

#### ANOVA
```json
{
  "test_name": "ANOVA (One-way)",
  "test_type": "anova",
  "statistics": {
    "f_statistic": 4.567,
    "p_value": 0.0089,
    "df_between": 2,
    "df_within": 27,
    "ss_between": 245.3,
    "ss_within": 567.8,
    "ms_between": 122.65,
    "ms_within": 21.03
  },
  "groups": {
    "Group1": { "n": 10, "mean": 50.2, "std": 8.1, "ci_mean_lower": 44.8, "ci_mean_upper": 55.6 },
    "Group2": { "n": 10, "mean": 45.8, "std": 7.5, "ci_mean_lower": 40.7, "ci_mean_upper": 50.9 },
    "Group3": { "n": 10, "mean": 42.1, "std": 9.2, "ci_mean_lower": 36.1, "ci_mean_upper": 48.1 }
  },
  "assumptions": {
    "normality": { "method": "Shapiro-Wilk", "p_value": 0.234, "passed": true },
    "homogeneity": { "method": "Levene", "p_value": 0.456, "passed": true }
  },
  "interpretation": "Significant difference between groups detected (p < 0.05)"
}
```

#### Mann-Whitney U Test
```json
{
  "test_name": "Wilcoxon Rank Sum (Mann-Whitney U)",
  "test_type": "mann_whitney",
  "statistics": {
    "u_statistic": 187.5,
    "p_value": 0.0312,
    "effect_size_r": 0.42
  },
  "groups": {
    "Group1": { "n": 25, "median": 48.5 },
    "Group2": { "n": 25, "median": 42.0 }
  },
  "interpretation": "Significant difference detected (p < 0.05)"
}
```

#### Wilcoxon Signed-Rank Test
```json
{
  "test_name": "Wilcoxon Signed-Rank Test",
  "test_type": "wilcoxon_signed_rank",
  "statistics": {
    "w_statistic": 156.0,
    "p_value": 0.0087,
    "effect_size_r": 0.51
  },
  "pairs": {
    "Var1": { "n": 25, "median": 50.3 },
    "Var2": { "n": 25, "median": 47.2 }
  },
  "interpretation": "Significant difference detected (p < 0.05)"
}
```

#### Kruskal-Wallis Test
```json
{
  "test_name": "Kruskal-Wallis Test",
  "test_type": "kruskal_wallis",
  "statistics": {
    "h_statistic": 6.234,
    "p_value": 0.0442,
    "df": 2
  },
  "groups": {
    "Group1": { "n": 10, "median": 48.2, "mean_rank": 18.5 },
    "Group2": { "n": 10, "median": 44.5, "mean_rank": 12.3 },
    "Group3": { "n": 10, "median": 41.8, "mean_rank": 8.2 }
  },
  "interpretation": "Significant difference between groups detected (p < 0.05)"
}
```

#### Chi-Square Test
```json
{
  "test_name": "Chi-Square Test",
  "test_type": "chi_square",
  "statistics": {
    "chi_square": 5.847,
    "p_value": 0.0156,
    "df": 2
  },
  "contingency_table": {
    "rows": ["Category1", "Category2"],
    "columns": ["GroupA", "GroupB", "GroupC"],
    "observed": [[25, 18, 12], [15, 22, 28]],
    "expected": [[22.3, 19.2, 13.5], [17.7, 20.8, 26.5]],
    "chi_square_contributions": [[0.33, 0.07, 0.17], [0.41, 0.07, 0.09]]
  },
  "interpretation": "Significant association between variables detected (p < 0.05)"
}
```

#### Pearson Correlation
```json
{
  "test_name": "Pearson Correlation",
  "test_type": "pearson_correlation",
  "statistics": {
    "correlation": 0.756,
    "p_value": 0.00012,
    "ci_lower": 0.612,
    "ci_upper": 0.851,
    "n": 48
  },
  "interpretation": "Strong positive correlation detected (p < 0.001)"
}
```

#### Spearman Correlation
```json
{
  "test_name": "Spearman Correlation",
  "test_type": "spearman_correlation",
  "statistics": {
    "correlation": 0.682,
    "p_value": 0.00034,
    "ci_lower": 0.512,
    "ci_upper": 0.805,
    "n": 48
  },
  "interpretation": "Strong positive correlation detected (p < 0.001)"
}
```

#### Kendall Correlation (Tau)
```json
{
  "test_name": "Kendall Correlation (Tau)",
  "test_type": "kendall_correlation",
  "statistics": {
    "tau": 0.512,
    "p_value": 0.00089,
    "n": 48
  },
  "interpretation": "Moderate positive correlation detected (p < 0.001)"
}
```

### Backend Implementation Strategy
- Create `/routes/statistical_tests.py` with endpoints for each test
- Use SciPy stats module for all calculations
- Create `/tests/test_runner.py` with test-specific functions:
  - `run_ttest(data, numeric_col, categorical_col)`
  - `run_paired_ttest(data, var1, var2)`
  - `run_anova(data, numeric_col, categorical_col)`
  - etc.

---

## UI/UX Flow

### Step 1: Test Selection
```
┌─────────────────────────────────────┐
│ Select Statistical Test             │
├─────────────────────────────────────┤
│ [t-Test] [Paired t] [ANOVA]         │
│ [Mann-Whitney] [Wilcoxon] [K-W]     │
│ [Chi-Square] [Pearson] [Spearman]   │
│ [Kendall]                            │
└─────────────────────────────────────┘
```

### Step 2: Variable Selection
```
┌─────────────────────────────────────┐
│ Configure Variables                 │
├─────────────────────────────────────┤
│ Numeric Variable: [Dropdown ▼]      │
│ Group Variable: [Dropdown ▼]        │
│                                     │
│ [Run Test] (enabled when ready)     │
└─────────────────────────────────────┘
```

### Step 3: Results Display
```
┌─────────────────────────────────────┐
│ Test Results: t-Test (Independent)  │
├─────────────────────────────────────┤
│ t-statistic: 2.354                  │
│ p-value: 0.0234 *                   │
│ Degrees of freedom: 48              │
│ Mean difference: 5.2 [0.8 - 9.6]    │
│                                     │
│ Group Statistics:                   │
│ Group1: n=25, M=50.3, SD=8.2        │
│ Group2: n=25, M=45.1, SD=7.9        │
│                                     │
│ Assumptions Met:                    │
│ ✓ Normality (p=0.234)               │
│ ✓ Homogeneity (p=0.456)             │
│                                     │
│ Conclusion: Significant difference  │
└─────────────────────────────────────┘
```

---

## File Changes

### New Files to Create
1. `frontend/src/components/Analysis.jsx` - Main analysis component
2. `frontend/src/components/TestTypeSelector.jsx` - Test selection UI
3. `frontend/src/components/TestVariableSelectors.jsx` - Variable selection UI
4. `frontend/src/components/TestResults.jsx` - Results display
5. `frontend/src/components/Analysis.css` - Styling
6. `backend/routes/statistical_tests.py` - Backend test endpoints
7. `backend/tests/test_runner.py` - Test execution functions

### Files to Replace
1. Replace `AnalysisPanel.jsx` with new `Analysis.jsx`
2. Remove `AnalysisPanel.css` if not needed

### Files to Update
1. `frontend/src/App.jsx` - Import new Analysis component
2. `backend/app.py` - Register new statistical test routes

---

## Implementation Checklist

### Frontend
- [ ] Create TestTypeSelector component (button grid + keyboard nav)
- [ ] Create TestVariableSelectors component (dynamic dropdowns)
- [ ] Create TestResults component (formatted results display)
- [ ] Create Analysis.jsx (main orchestrator)
- [ ] Create Analysis.css (styling)
- [ ] Add test configuration mapping with all 10 tests
- [ ] Implement variable filtering by type
- [ ] Implement requirement validation
- [ ] Add loading states and error handling
- [ ] Test all test type transitions
- [ ] Test variable selection for each test type
- [ ] Verify API calls with correct payload

### Backend
- [ ] Create statistical_tests.py routes file
- [ ] Create test_runner.py with 10 test functions
- [ ] Implement t-test with assumptions checks
- [ ] Implement paired t-test
- [ ] Implement ANOVA with post-hoc (optional)
- [ ] Implement Mann-Whitney U test
- [ ] Implement Wilcoxon signed-rank test
- [ ] Implement Kruskal-Wallis test
- [ ] Implement Chi-square test
- [ ] Implement Pearson correlation
- [ ] Implement Spearman correlation
- [ ] Implement Kendall correlation
- [ ] Add input validation for each test
- [ ] Test with sample data for each test type
- [ ] Verify response format consistency

### Integration & Testing
- [ ] Link Analysis to main App navigation
- [ ] Test full workflow: upload → test selection → variable selection → results
- [ ] Test with datasets of varying sizes
- [ ] Test edge cases (missing data, insufficient samples, etc.)
- [ ] Verify error messages are user-friendly
- [ ] Test keyboard navigation in test selector
- [ ] Verify p-value interpretations are correct

---

## Technical Specifications

### Variable Type Detection
- **Numeric**: Cast to float, filter NaN values
- **Categorical**: Check unique value count
  - Binary: exactly 2 unique values
  - Multi-class: ≥2 unique values

### Data Validation
- Check for missing values and handle appropriately
- Verify sample size requirements (e.g., t-test needs n>1 per group)
- Validate variable types match test requirements
- Prevent duplicate variable selection (e.g., same var for both inputs in paired test)

### Statistical Output Format
- t-statistics: 3 decimal places
- p-values: 4 decimal places or scientific notation if <0.0001
- Correlations: 4 decimal places
- Effect sizes: 3 decimal places

---

## Estimated Timeline
- Frontend component creation: 2-3 hours
- Backend endpoint implementation: 2-3 hours
- Testing & debugging: 1-2 hours
- Total: 5-8 hours

---

## Notes
- Follow existing Visualization page pattern for consistency
- Reuse CSS patterns and color scheme
- Consider adding interpretation guides for each test
- Future enhancement: Add assumptions testing and recommendations

---

# Regression Analysis Page - Implementation Plan

## Overview
Create a new Regression Analysis page with similar flow to Statistical Tests page. Users will:
1. Select regression type (Linear or Logistic)
2. Choose dependent and independent variables
3. Send data to backend for model fitting
4. Display regression coefficients, model fit statistics, p-values, R-squared, etc.

---

## Regression Types & Requirements

### 1. Linear Regression
- **Dependent Variable**: Numeric (continuous)
- **Independent Variables**: Multiple selection of numeric and categorical variables
- **Output**:
  - Model coefficients table (coefficient, std error, t-statistic, p-value, 95% CI)
  - Model fit: R-squared, Adjusted R-squared
  - Overall F-statistic and p-value
  - Residual statistics
  - Assumption checks (normality, homoscedasticity, multicollinearity)

### 2. Logistic Regression
- **Dependent Variable**: Binary categorical (exactly 2 classes)
- **Independent Variables**: Multiple selection (numeric and categorical)
- **Output**:
  - Model coefficients table (coefficient, std error, z-statistic, p-value, 95% CI, Odds Ratio)
  - Model fit: McFadden's R-squared, AIC, BIC
  - Overall chi-square statistic and p-value
  - Confusion matrix / classification metrics (optional)
  - Assumption checks (multicollinearity)

---

## Frontend Implementation

### Component Structure
```
Regression.jsx (main page)
├── RegressionTypeSelector.jsx (regression selection)
├── RegressionVariableSelectors.jsx (variable configuration)
└── RegressionResults.jsx (results display)
```

### Regression Configuration Mapping
```jsx
const regressionConfigs = {
  linear: {
    name: 'Linear Regression',
    description: 'Model continuous dependent variable using multiple predictors',
    icon: '📈',
    requirements: [
      { key: 'dependent', type: 'numeric', label: 'Dependent Variable', required: true },
      { key: 'independent', type: 'any', label: 'Independent Variables', required: true, multiple: true }
    ],
    endpoint: '/api/regression/linear'
  },
  logistic: {
    name: 'Logistic Regression',
    description: 'Model binary outcome using multiple predictors',
    icon: '🔀',
    requirements: [
      { key: 'dependent', type: 'categorical', label: 'Dependent Variable (Binary)', required: true, minClasses: 2, maxClasses: 2 },
      { key: 'independent', type: 'any', label: 'Independent Variables', required: true, multiple: true }
    ],
    endpoint: '/api/regression/logistic'
  }
}
```

### State Management
```jsx
const [selectedRegression, setSelectedRegression] = useState('')
const [selectedVars, setSelectedVars] = useState({ dependent: '', independent: [] })
const [regressionResults, setRegressionResults] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
```

---

## Backend Implementation

### API Endpoints

#### Linear Regression
```
POST /api/regression/linear
{
  "file_id": "...",
  "variables": {
    "dependent": "numeric_column",
    "independent": ["numeric_col1", "categorical_col2", ...]
  }
}
```

**Response Format:**
```json
{
  "regression_type": "linear",
  "dependent_variable": "variable_name",
  "independent_variables": ["var1", "var2", ...],
  "model_fit": {
    "r_squared": 0.756,
    "adjusted_r_squared": 0.742,
    "f_statistic": 54.234,
    "f_pvalue": 0.00000001,
    "n_samples": 100,
    "n_predictors": 3
  },
  "coefficients": [
    {
      "variable": "Intercept",
      "coefficient": 25.3,
      "std_error": 2.1,
      "t_statistic": 12.05,
      "p_value": 0.00001,
      "ci_lower": 21.2,
      "ci_upper": 29.4
    },
    {
      "variable": "var1",
      "coefficient": 0.45,
      "std_error": 0.08,
      "t_statistic": 5.625,
      "p_value": 0.00003,
      "ci_lower": 0.29,
      "ci_upper": 0.61
    },
    {
      "variable": "var2[categorical_level]",
      "coefficient": -3.2,
      "std_error": 1.4,
      "t_statistic": -2.286,
      "p_value": 0.0245,
      "ci_lower": -6.0,
      "ci_upper": -0.4
    }
  ],
  "residuals": {
    "residual_std_error": 5.67,
    "degrees_of_freedom": 96,
    "min": -12.3,
    "max": 14.5,
    "mean": -0.02
  },
  "assumptions": {
    "multicollinearity": {
      "method": "VIF",
      "passed": true,
      "details": { "var1": 1.23, "var2": 1.45 }
    },
    "normality": {
      "method": "Shapiro-Wilk (residuals)",
      "p_value": 0.145,
      "passed": true
    },
    "homoscedasticity": {
      "method": "Breusch-Pagan",
      "p_value": 0.234,
      "passed": true
    }
  },
  "interpretation": "Model explains 75.6% of variance. All predictors significant at p<0.05."
}
```

#### Logistic Regression
```
POST /api/regression/logistic
{
  "file_id": "...",
  "variables": {
    "dependent": "binary_categorical_column",
    "independent": ["var1", "var2", ...]
  }
}
```

**Response Format:**
```json
{
  "regression_type": "logistic",
  "dependent_variable": "outcome",
  "independent_variables": ["var1", "var2", ...],
  "model_fit": {
    "mcfadden_r_squared": 0.312,
    "aic": 145.23,
    "bic": 156.78,
    "chi_square": 32.456,
    "chi_square_pvalue": 0.0012,
    "n_samples": 150
  },
  "coefficients": [
    {
      "variable": "Intercept",
      "coefficient": -1.23,
      "std_error": 0.35,
      "z_statistic": -3.514,
      "p_value": 0.000441,
      "ci_lower": -1.92,
      "ci_upper": -0.54,
      "odds_ratio": 0.292
    },
    {
      "variable": "var1",
      "coefficient": 0.67,
      "std_error": 0.14,
      "z_statistic": 4.786,
      "p_value": 0.0000017,
      "ci_lower": 0.40,
      "ci_upper": 0.94,
      "odds_ratio": 1.954
    },
    {
      "variable": "var2[level2]",
      "coefficient": 0.45,
      "std_error": 0.28,
      "z_statistic": 1.607,
      "p_value": 0.108,
      "ci_lower": -0.10,
      "ci_upper": 1.00,
      "odds_ratio": 1.568
    }
  ],
  "classification_metrics": {
    "accuracy": 0.84,
    "sensitivity": 0.78,
    "specificity": 0.88,
    "auc": 0.89
  },
  "assumptions": {
    "multicollinearity": {
      "method": "VIF",
      "passed": true,
      "details": { "var1": 1.12, "var2": 1.34 }
    }
  },
  "interpretation": "Each unit increase in var1 multiplies odds by 1.95. Model shows good predictive power (AUC=0.89)."
}
```

### Backend Implementation Functions

**File**: `backend/routes/regression.py`
```python
from fastapi import APIRouter
from services.regression_runner import (
    run_linear_regression,
    run_logistic_regression
)

router = APIRouter(prefix="/api/regression", tags=["regression"])

@router.post("/linear")
async def linear_regression(request: RegressionRequest):
    """Perform linear regression"""
    file_data = load_file_data(request.file_id)
    results = run_linear_regression(
        file_data,
        request.variables['dependent'],
        request.variables['independent']
    )
    return results

@router.post("/logistic")
async def logistic_regression(request: RegressionRequest):
    """Perform logistic regression"""
    file_data = load_file_data(request.file_id)
    results = run_logistic_regression(
        file_data,
        request.variables['dependent'],
        request.variables['independent']
    )
    return results
```

**File**: `backend/services/regression_runner.py`
```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from scipy import stats
from statsmodels.stats.outliers_influence import variance_inflation_factor

def run_linear_regression(data, dependent_var, independent_vars):
    """Fit linear regression model"""
    # Prepare data, handle categorical variables
    # Fit model using statsmodels for detailed output
    # Calculate coefficients, std errors, t-stats, p-values, 95% CI
    # Compute R-squared, Adjusted R-squared, F-statistic, residuals
    # Check assumptions (multicollinearity VIF, normality, homoscedasticity)
    # Return formatted results

def run_logistic_regression(data, dependent_var, independent_vars):
    """Fit logistic regression model"""
    # Prepare binary dependent variable
    # Handle categorical predictors
    # Fit model using statsmodels for detailed output
    # Calculate coefficients, z-stats, p-values, Odds Ratios
    # Compute McFadden's R², AIC, BIC, chi-square
    # Check assumptions (multicollinearity VIF)
    # Calculate classification metrics (accuracy, sensitivity, specificity, AUC)
    # Return formatted results
```

---

## UI/UX Flow

### Step 1: Regression Type Selection
```
┌─────────────────────────────────────┐
│ Select Regression Type              │
├─────────────────────────────────────┤
│ [Linear Regression] [Logistic]      │
│ 📈 Model continuous outcome         │
│ 🔀 Model binary outcome             │
└─────────────────────────────────────┘
```

### Step 2: Variable Configuration
```
┌─────────────────────────────────────┐
│ Configure Regression Model          │
├─────────────────────────────────────┤
│ Dependent: [Dropdown ▼]             │
│ Numeric                             │
│                                     │
│ Independent: [var1] [var2] [+]      │
│ (Multiple selection, drag/reorder)   │
│                                     │
│ [Run Regression] (enabled when ready)|
└─────────────────────────────────────┘
```

### Step 3: Results Display
```
┌─────────────────────────────────────┐
│ Linear Regression Results           │
├─────────────────────────────────────┤
│ Model Fit Statistics:               │
│ R² = 0.756, Adj-R² = 0.742          │
│ F(3,96) = 54.23, p < 0.001          │
│                                     │
│ Coefficients:                       │
│ ┌─────────────────────────────────┐ │
│ │ Variable  │ Coef │ SE  │ p-value│ │
│ ├─────────────────────────────────┤ │
│ │Intercept │25.30│2.10 │<0.001 *│ │
│ │var1      │ 0.45│0.08 │<0.001 *│ │
│ │var2      │-3.20│1.40 │0.024 * │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Assumptions:                        │
│ ✓ No multicollinearity (VIF < 5)    │
│ ✓ Normality of residuals            │
│ ✓ Homoscedasticity                  │
└─────────────────────────────────────┘
```

---

## File Changes

### New Files to Create
1. `frontend/src/components/Regression.jsx` - Main regression component
2. `frontend/src/components/RegressionTypeSelector.jsx` - Type selection UI
3. `frontend/src/components/RegressionVariableSelectors.jsx` - Variable configuration
4. `frontend/src/components/RegressionResults.jsx` - Results display
5. `frontend/src/components/Regression.css` - Styling
6. `backend/routes/regression.py` - Backend regression endpoints
7. `backend/services/regression_runner.py` - Regression execution functions

### Files to Update
1. `frontend/src/App.jsx` - Add Regression route/navigation
2. `backend/app.py` - Register regression routes

---

## Implementation Checklist

### Frontend
- [ ] Create RegressionTypeSelector component (button layout)
- [ ] Create RegressionVariableSelectors component (multi-select for independent vars)
- [ ] Create RegressionResults component (coefficients table, statistics display)
- [ ] Create Regression.jsx (main orchestrator)
- [ ] Create Regression.css (styling to match Analysis page)
- [ ] Add regression configuration mapping for linear and logistic
- [ ] Implement variable filtering and constraints
- [ ] Implement multiple variable selection with UI controls (add/remove)
- [ ] Add loading states and error handling
- [ ] Validate dependent variable requirements
- [ ] Test both regression types end-to-end

### Backend
- [ ] Create regression.py routes file
- [ ] Create regression_runner.py with regression functions
- [ ] Implement linear regression with statsmodels
- [ ] Calculate coefficients, standard errors, t-stats, p-values, 95% CI
- [ ] Calculate R², Adjusted R², F-statistic
- [ ] Check multicollinearity (VIF)
- [ ] Check residual normality (Shapiro-Wilk)
- [ ] Check homoscedasticity (Breusch-Pagan)
- [ ] Implement logistic regression with statsmodels
- [ ] Calculate odds ratios for logistic coefficients
- [ ] Calculate McFadden's R², AIC, BIC
- [ ] Calculate classification metrics (accuracy, AUC)
- [ ] Handle categorical variables (automatic one-hot encoding)
- [ ] Add input validation
- [ ] Test with sample data for both regression types

### Integration & Testing
- [ ] Link Regression to main App navigation
- [ ] Test full workflow: upload → type selection → variable config → results
- [ ] Test with datasets of varying sizes
- [ ] Test edge cases (missing data, insufficient samples)
- [ ] Verify coefficient interpretations
- [ ] Test with mixed numeric and categorical predictors
- [ ] Verify Odds Ratios calculation in logistic regression

---

## Technical Specifications

### Variable Handling
- **Numeric predictors**: Use as-is after standardization (optional for interpretation)
- **Categorical predictors**: One-hot encode, drop first level to avoid multicollinearity
- **Missing values**: Remove rows with missing values in dependent or any independent variable

### Output Format
- Coefficients: 4 decimal places
- p-values: 4 decimal places (or scientific notation if <0.0001)
- R-squared: 4 decimal places
- Odds ratios: 4 decimal places
- Standard errors: 4 decimal places

### Assumption Checks
- **VIF**: Variance Inflation Factor > 5 indicates multicollinearity
- **Normality**: Shapiro-Wilk test on residuals, p > 0.05 passes
- **Homoscedasticity**: Breusch-Pagan test, p > 0.05 passes

---

## Libraries & Dependencies
- Frontend: React, Recharts (for future diagnostic plots)
- Backend:
  - statsmodels (for regression models with detailed output)
  - scikit-learn (for preprocessing and metrics)
  - scipy (for statistical tests)
  - pandas, numpy

---

## Notes
- Follow existing Analysis page pattern for consistency
- Reuse CSS components and styling
- Consider adding diagnostic plots (residuals vs fitted, Q-Q plot) as future enhancement
- Logistic regression with >2 classes requires multinomial regression (future feature)
- Add interpretation guide for coefficients and odds ratios
