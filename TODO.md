# Data Summary Page Implementation Plan

## Overview
Create a new "Data Summary" page that displays detailed statistics for each variable based on its type (numeric, categorical, date, text).

## Phase 1: Backend API Endpoint

### 1.1 Create `/api/summary-statistics/{file_id}` endpoint
- **Input**: file_id, variableAnalysis (from frontend with currentType)
- **Output**: Summary statistics for each variable based on its type
- **Location**: `/backend/app.py`

### 1.2 Implement statistics functions for each type

#### Numeric Variables
```python
def compute_numeric_summary(series):
    # Calculate:
    # - Mean, SD, Median, Q1, Q3, Min, Max
    # - Missingness (count and percentage)
    # - Kurtosis, Skewness
    # - Shapiro-Wilk test (statistic, p-value)
    # - Jarque-Bera test (statistic, p-value)
    # Use: scipy.stats.shapiro, scipy.stats.jarque_bera
```

#### Categorical Variables
```python
def compute_categorical_summary(series):
    # Calculate:
    # - Number of unique classes
    # - Missingness (count and percentage)
    # - Frequency table: [{class, count, percentage}]
    # Return sorted by class name (default)
```

#### Date Variables
```python
def compute_date_summary(series, rounding='day'):
    # Calculate:
    # - Min, Max (as date strings)
    # - Missingness (count and percentage)
    # - Frequency table with rounding: [{date, count, percentage}]
    # Support rounding options: 'year', 'month', 'week', 'day'
    # Use: pd.to_datetime() then .dt.to_period() or .dt.floor()
```

#### Text Variables
```python
def compute_text_summary(series, seed=None):
    # Calculate:
    # - Missingness (count and percentage)
    # - 5 random sample values
    # Support re-sampling with different seed
```

### 1.3 Endpoint structure
```python
@app.post("/api/summary-statistics/{file_id}")
async def get_summary_statistics(file_id: str, request: dict):
    # request body: {
    #   "variables": [
    #     {"name": "age", "currentType": "numeric"},
    #     {"name": "gender", "currentType": "categorical"},
    #     ...
    #   ],
    #   "dateRounding": {"date_col": "month", ...},  # optional
    #   "textSeed": 42  # optional, for reproducible text sampling
    # }

    # Return: {
    #   "file_id": "...",
    #   "summaries": {
    #     "age": {
    #       "type": "numeric",
    #       "mean": 35.5,
    #       "sd": 12.3,
    #       ...
    #     },
    #     "gender": {
    #       "type": "categorical",
    #       "unique_count": 3,
    #       "frequency_table": [...]
    #       ...
    #     },
    #     ...
    #   }
    # }
```

## Phase 2: Frontend Component

### 2.1 Create DataSummary component
- **File**: `/frontend/src/components/DataSummary.jsx`
- **Props**:
  - `fileId` - to fetch summary statistics
  - `variableAnalysis` - to know variable types
- **State**:
  - `summaryData` - fetched statistics
  - `loading` - loading state
  - `error` - error state
  - `dateRounding` - object mapping date columns to rounding option
  - `textSeed` - current seed for text sampling
  - `sortConfig` - object mapping variable name to {column, direction}

### 2.2 Component structure
```jsx
export default function DataSummary({ fileId, variableAnalysis }) {
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRounding, setDateRounding] = useState({})
  const [textSeed, setTextSeed] = useState(42)
  const [sortConfig, setSortConfig] = useState({})

  useEffect(() => {
    fetchSummaryStatistics()
  }, [fileId, variableAnalysis, dateRounding, textSeed])

  // Fetch function, sort handlers, re-sample handlers

  return (
    <div className="data-summary">
      <h2>Data Summary</h2>
      {variableAnalysis?.map(variable => (
        <div key={variable.name} className="variable-summary-section">
          <h3>{variable.name} ({variable.currentType})</h3>
          {renderSummaryByType(variable, summaryData[variable.name])}
        </div>
      ))}
    </div>
  )
}
```

### 2.3 Render functions for each type

#### Numeric Summary Card
```jsx
function renderNumericSummary(variable, summary) {
  return (
    <div className="numeric-summary">
      <div className="stats-grid">
        <StatItem label="Mean" value={summary.mean} />
        <StatItem label="SD" value={summary.sd} />
        <StatItem label="Median" value={summary.median} />
        <StatItem label="Q1" value={summary.q1} />
        <StatItem label="Q3" value={summary.q3} />
        <StatItem label="Min" value={summary.min} />
        <StatItem label="Max" value={summary.max} />
        <StatItem label="Missingness" value={`${summary.missing_count} (${summary.missing_percent}%)`} />
        <StatItem label="Kurtosis" value={summary.kurtosis} />
        <StatItem label="Skewness" value={summary.skewness} />
      </div>
      <div className="test-results">
        <h4>Normality Tests</h4>
        <TestResult
          name="Shapiro-Wilk"
          statistic={summary.shapiro_stat}
          pValue={summary.shapiro_p}
        />
        <TestResult
          name="Jarque-Bera"
          statistic={summary.jb_stat}
          pValue={summary.jb_p}
        />
      </div>
    </div>
  )
}
```

#### Categorical Summary Card
```jsx
function renderCategoricalSummary(variable, summary, sortConfig) {
  return (
    <div className="categorical-summary">
      <div className="basic-stats">
        <StatItem label="Unique Classes" value={summary.unique_count} />
        <StatItem label="Missingness" value={`${summary.missing_count} (${summary.missing_percent}%)`} />
      </div>
      <SortableFrequencyTable
        data={summary.frequency_table}
        variableName={variable.name}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  )
}
```

#### Date Summary Card
```jsx
function renderDateSummary(variable, summary, dateRounding) {
  return (
    <div className="date-summary">
      <div className="basic-stats">
        <StatItem label="Min" value={summary.min_date} />
        <StatItem label="Max" value={summary.max_date} />
        <StatItem label="Missingness" value={`${summary.missing_count} (${summary.missing_percent}%)`} />
      </div>
      <DateRoundingSelector
        variableName={variable.name}
        currentRounding={dateRounding[variable.name] || 'day'}
        onChange={handleDateRoundingChange}
      />
      <SortableFrequencyTable
        data={summary.frequency_table}
        variableName={variable.name}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  )
}
```

#### Text Summary Card
```jsx
function renderTextSummary(variable, summary) {
  return (
    <div className="text-summary">
      <div className="basic-stats">
        <StatItem label="Missingness" value={`${summary.missing_count} (${summary.missing_percent}%)`} />
      </div>
      <div className="sample-section">
        <h4>Sample Values</h4>
        <ul className="text-samples">
          {summary.samples.map((sample, idx) => (
            <li key={idx}>{sample}</li>
          ))}
        </ul>
        <button
          className="resample-button"
          onClick={() => handleResample(variable.name)}
        >
          Re-sample
        </button>
      </div>
    </div>
  )
}
```

### 2.4 Sortable Table Component
```jsx
function SortableFrequencyTable({ data, variableName, sortConfig, onSort }) {
  const currentSort = sortConfig[variableName] || { column: 'name', direction: 'asc' }

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a[currentSort.column]
      const bVal = b[currentSort.column]
      const direction = currentSort.direction === 'asc' ? 1 : -1
      return aVal > bVal ? direction : -direction
    })
    return sorted
  }, [data, currentSort])

  return (
    <table className="frequency-table">
      <thead>
        <tr>
          <th onClick={() => onSort(variableName, 'name')}>
            Class {renderSortIcon('name', currentSort)}
          </th>
          <th onClick={() => onSort(variableName, 'count')}>
            Count {renderSortIcon('count', currentSort)}
          </th>
          <th onClick={() => onSort(variableName, 'percentage')}>
            Percentage {renderSortIcon('percentage', currentSort)}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, idx) => (
          <tr key={idx}>
            <td>{row.name}</td>
            <td>{row.count}</td>
            <td>{row.percentage}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Phase 3: Styling

### 3.1 Create DataSummary.css
- **File**: `/frontend/src/components/DataSummary.css`
- **Key styles**:
  - `.data-summary` - main container
  - `.variable-summary-section` - card for each variable
  - `.stats-grid` - grid layout for numeric stats
  - `.frequency-table` - sortable table styles
  - `.sortable-header` - clickable header with sort icons
  - `.resample-button` - button for text re-sampling
  - Dark mode support with CSS variables

### 3.2 Type-specific styling
- Color coding matching DataDisplay page
- Numeric: Blue theme
- Categorical: Purple theme
- Date: Green theme
- Text: Yellow theme

## Phase 4: Integration

### 4.1 Update App.jsx
```jsx
// Import DataSummary component
import DataSummary from './components/DataSummary'

// Add navigation button after Data Types
<button
  className={currentPage === 'summary' ? 'active' : ''}
  onClick={() => setCurrentPage('summary')}
>
  Data Summary
</button>

// Add route
{currentPage === 'summary' && uploadedFile && variableAnalysis && (
  <DataSummary
    fileId={uploadedFile.file_id}
    variableAnalysis={variableAnalysis}
  />
)}
```

### 4.2 Update navigation flow
- Order: Upload → Data Preview → Data Types → **Data Summary** → Analysis → Results
- All pages accessible after upload (non-linear navigation maintained)

## Phase 5: Dependencies and Libraries

### 5.1 Backend (requirements.txt)
- Add if not present:
  - `scipy` - for shapiro, jarque_bera tests

### 5.2 Frontend
- No new dependencies needed (using existing React hooks)

## Implementation Steps Summary

1. **Backend** (app.py):
   - [ ] Add scipy to requirements.txt
   - [ ] Implement `compute_numeric_summary()`
   - [ ] Implement `compute_categorical_summary()`
   - [ ] Implement `compute_date_summary(series, rounding)`
   - [ ] Implement `compute_text_summary(series, seed)`
   - [ ] Create `/api/summary-statistics/{file_id}` endpoint
   - [ ] Test endpoint with sample data

2. **Frontend Components**:
   - [ ] Create `DataSummary.jsx` with main structure
   - [ ] Implement `renderNumericSummary()`
   - [ ] Implement `renderCategoricalSummary()`
   - [ ] Implement `renderDateSummary()`
   - [ ] Implement `renderTextSummary()`
   - [ ] Create `SortableFrequencyTable` component
   - [ ] Implement sort logic (toggle asc/desc)
   - [ ] Implement date rounding selector
   - [ ] Implement text re-sampling logic

3. **Styling**:
   - [ ] Create `DataSummary.css`
   - [ ] Style numeric stats grid
   - [ ] Style frequency tables with sortable headers
   - [ ] Style date rounding selector
   - [ ] Style re-sample button
   - [ ] Add dark mode support

4. **Integration**:
   - [ ] Add DataSummary import to App.jsx
   - [ ] Add "Data Summary" navigation button
   - [ ] Add route for summary page
   - [ ] Update navigation order

5. **Testing**:
   - [ ] Test with numeric variables
   - [ ] Test with categorical variables (sorting)
   - [ ] Test with date variables (different rounding options)
   - [ ] Test with text variables (re-sampling)
   - [ ] Test navigation flow
   - [ ] Test dark mode

## Notes

- **Sortable tables**: Click header to sort, click again to reverse direction
- **Date rounding**: Dropdown with options [Year, Month, Week, Day], triggers new API call when changed
- **Text re-sampling**: Increment seed and re-fetch to get new samples
- **Statistical tests**: Display both statistic and p-value, maybe add interpretation (p < 0.05 → not normal)
- **Missing values**: Handled in all calculations, excluded from statistics
- **Performance**: Consider caching summary results in backend to avoid recomputation
