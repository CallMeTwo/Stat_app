# Visualization Page Implementation Plan

## Overview
Create a new "Visualization" page that allows users to generate interactive plots using Plotly.js. Users select a plot type, then appropriate variable dropdowns appear based on the plot requirements. Backend sends filtered data for the requested plot, frontend renders using Plotly.

## Plot Types and Variable Requirements

### Numeric Distribution Plots
These plots require **1 numeric variable** and **1 optional categorical variable** (for grouping):
1. **Histogram** - Distribution of numeric variable, optionally grouped by categories
2. **Box Plot** - Box-and-whisker plot, optionally grouped by categories
3. **Density Plot** - Kernel density estimation, optionally grouped by categories
4. **Violin Plot** - Combination of box plot and density plot, optionally grouped by categories
5. **Mean ± 95% CI Plot** - Point with error bars showing mean and confidence interval, optionally grouped by categories

### Categorical Plot
6. **Bar Plot** - Requires **1 categorical variable**, **1 optional categorical variable** (for stacking/clustering)

### Relationship Plot
7. **Scatter Plot** - Requires **2 numeric variables** (X and Y axis), **1 optional categorical variable** (for dot color/grouping)

## Implementation Phases

---

## Phase 1: Backend API Endpoint

### 1.1 Create `/api/visualize/{file_id}` endpoint
- **Input**:
  ```json
  {
    "plot_type": "histogram" | "boxplot" | "density" | "violin" | "mean_ci" | "barplot" | "scatter",
    "variables": {
      "numeric": "variable_name",  // for histogram, boxplot, density, violin, mean_ci
      "categorical": "group_variable",  // optional grouping
      "x_axis": "variable_name",  // for scatter
      "y_axis": "variable_name",  // for scatter
      "categorical_main": "variable_name",  // for barplot
      "categorical_stack": "variable_name"  // optional for barplot
    }
  }
  ```
- **Output**: JSON data ready for Plotly rendering
  ```json
  {
    "data": [...],  // Plotly data traces
    "layout": {...}  // Plotly layout configuration
  }
  ```

### 1.2 Implement data preparation functions

Backend sends **filtered raw data** in Plotly-ready format. Frontend uses Plotly.js to render.

#### Histogram
```python
def prepare_histogram_data(df, numeric_var, group_var=None):
    """Prepare data for Plotly histogram"""
    data_traces = []

    if group_var:
        # Grouped histogram
        groups = df[group_var].dropna().unique()
        for group in groups:
            values = df[df[group_var] == group][numeric_var].dropna().tolist()
            data_traces.append({
                'x': values,
                'type': 'histogram',
                'name': str(group),
                'opacity': 0.7
            })
    else:
        # Single histogram
        values = df[numeric_var].dropna().tolist()
        data_traces.append({
            'x': values,
            'type': 'histogram',
            'name': numeric_var
        })

    layout = {
        'title': f'Histogram of {numeric_var}',
        'xaxis': {'title': numeric_var},
        'yaxis': {'title': 'Count'},
        'barmode': 'overlay' if group_var else 'stack'
    }

    return {'data': data_traces, 'layout': layout}
```

#### Box Plot
```python
def prepare_boxplot_data(df, numeric_var, group_var=None):
    """Prepare data for Plotly box plot"""
    data_traces = []

    if group_var:
        # Grouped box plot
        groups = df[group_var].dropna().unique()
        for group in groups:
            values = df[df[group_var] == group][numeric_var].dropna().tolist()
            data_traces.append({
                'y': values,
                'type': 'box',
                'name': str(group)
            })
    else:
        # Single box plot
        values = df[numeric_var].dropna().tolist()
        data_traces.append({
            'y': values,
            'type': 'box',
            'name': numeric_var
        })

    layout = {
        'title': f'Box Plot of {numeric_var}',
        'yaxis': {'title': numeric_var}
    }

    return {'data': data_traces, 'layout': layout}
```

#### Violin Plot
```python
def prepare_violin_data(df, numeric_var, group_var=None):
    """Prepare data for Plotly violin plot"""
    data_traces = []

    if group_var:
        # Grouped violin plot
        groups = df[group_var].dropna().unique()
        for group in groups:
            values = df[df[group_var] == group][numeric_var].dropna().tolist()
            data_traces.append({
                'y': values,
                'type': 'violin',
                'name': str(group),
                'box': {'visible': True},
                'meanline': {'visible': True}
            })
    else:
        # Single violin plot
        values = df[numeric_var].dropna().tolist()
        data_traces.append({
            'y': values,
            'type': 'violin',
            'name': numeric_var,
            'box': {'visible': True},
            'meanline': {'visible': True}
        })

    layout = {
        'title': f'Violin Plot of {numeric_var}',
        'yaxis': {'title': numeric_var}
    }

    return {'data': data_traces, 'layout': layout}
```

#### Scatter Plot
```python
def prepare_scatter_data(df, x_var, y_var, color_var=None):
    """Prepare data for Plotly scatter plot"""
    data_traces = []

    if color_var:
        # Colored by groups
        groups = df[color_var].dropna().unique()
        for group in groups:
            subset = df[df[color_var] == group]
            data_traces.append({
                'x': subset[x_var].dropna().tolist(),
                'y': subset[y_var].dropna().tolist(),
                'mode': 'markers',
                'type': 'scatter',
                'name': str(group)
            })
    else:
        # Single scatter
        data_traces.append({
            'x': df[x_var].dropna().tolist(),
            'y': df[y_var].dropna().tolist(),
            'mode': 'markers',
            'type': 'scatter',
            'name': f'{x_var} vs {y_var}'
        })

    layout = {
        'title': f'{y_var} vs {x_var}',
        'xaxis': {'title': x_var},
        'yaxis': {'title': y_var}
    }

    return {'data': data_traces, 'layout': layout}
```

#### Bar Plot
```python
def prepare_barplot_data(df, categorical_var, stack_var=None):
    """Prepare data for Plotly bar plot"""
    data_traces = []

    if stack_var:
        # Stacked/grouped bar plot
        stack_groups = df[stack_var].dropna().unique()
        for stack_group in stack_groups:
            subset = df[df[stack_var] == stack_group]
            counts = subset[categorical_var].value_counts().to_dict()
            data_traces.append({
                'x': list(counts.keys()),
                'y': list(counts.values()),
                'type': 'bar',
                'name': str(stack_group)
            })
    else:
        # Simple bar plot
        counts = df[categorical_var].value_counts().to_dict()
        data_traces.append({
            'x': list(counts.keys()),
            'y': list(counts.values()),
            'type': 'bar',
            'name': categorical_var
        })

    layout = {
        'title': f'Bar Plot of {categorical_var}',
        'xaxis': {'title': categorical_var},
        'yaxis': {'title': 'Count'},
        'barmode': 'group' if stack_var else 'stack'
    }

    return {'data': data_traces, 'layout': layout}
```

#### Mean ± 95% CI Plot
```python
from scipy import stats
import numpy as np

def prepare_mean_ci_data(df, numeric_var, group_var=None):
    """Prepare data for Plotly error bar plot (mean with 95% CI)"""

    if group_var:
        # Grouped mean CI plot
        groups = df[group_var].dropna().unique()
        x_labels = []
        means = []
        error_bars = []

        for group in groups:
            data = df[df[group_var] == group][numeric_var].dropna()
            if len(data) > 1:
                mean = data.mean()
                ci = stats.t.interval(0.95, len(data)-1, loc=mean, scale=stats.sem(data))

                x_labels.append(str(group))
                means.append(mean)
                error_bars.append(ci[1] - mean)  # error is symmetric

        data_trace = {
            'x': x_labels,
            'y': means,
            'error_y': {
                'type': 'data',
                'array': error_bars,
                'visible': True
            },
            'type': 'scatter',
            'mode': 'markers',
            'marker': {'size': 10},
            'name': numeric_var
        }
    else:
        # Single mean CI
        data = df[numeric_var].dropna()
        mean = data.mean()
        ci = stats.t.interval(0.95, len(data)-1, loc=mean, scale=stats.sem(data))

        data_trace = {
            'x': [numeric_var],
            'y': [mean],
            'error_y': {
                'type': 'data',
                'array': [ci[1] - mean],
                'visible': True
            },
            'type': 'scatter',
            'mode': 'markers',
            'marker': {'size': 10},
            'name': numeric_var
        }

    layout = {
        'title': f'Mean ± 95% CI: {numeric_var}',
        'yaxis': {'title': numeric_var}
    }

    return {'data': [data_trace], 'layout': layout}
```

#### Density Plot (using histogram with KDE)
```python
def prepare_density_data(df, numeric_var, group_var=None):
    """Prepare data for density plot using Plotly histogram"""
    data_traces = []

    if group_var:
        # Grouped density plot
        groups = df[group_var].dropna().unique()
        for group in groups:
            values = df[df[group_var] == group][numeric_var].dropna().tolist()
            data_traces.append({
                'x': values,
                'type': 'histogram',
                'histnorm': 'probability density',
                'name': str(group),
                'opacity': 0.7
            })
    else:
        # Single density plot
        values = df[numeric_var].dropna().tolist()
        data_traces.append({
            'x': values,
            'type': 'histogram',
            'histnorm': 'probability density',
            'name': numeric_var
        })

    layout = {
        'title': f'Density Plot of {numeric_var}',
        'xaxis': {'title': numeric_var},
        'yaxis': {'title': 'Density'},
        'barmode': 'overlay'
    }

    return {'data': data_traces, 'layout': layout}
```

### 1.3 Main endpoint implementation
```python
@app.post("/api/visualize/{file_id}")
async def get_visualization_data(file_id: str, request_data: dict = Body(...)):
    """Generate plot data for frontend Plotly rendering"""
    try:
        if file_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="File not found")

        df = uploaded_files[file_id]['dataframe']
        plot_type = request_data.get('plot_type')
        variables = request_data.get('variables', {})

        # Dispatch to appropriate function
        if plot_type == 'histogram':
            result = prepare_histogram_data(
                df,
                variables.get('numeric'),
                variables.get('categorical')
            )
        elif plot_type == 'boxplot':
            result = prepare_boxplot_data(
                df,
                variables.get('numeric'),
                variables.get('categorical')
            )
        elif plot_type == 'violin':
            result = prepare_violin_data(
                df,
                variables.get('numeric'),
                variables.get('categorical')
            )
        elif plot_type == 'density':
            result = prepare_density_data(
                df,
                variables.get('numeric'),
                variables.get('categorical')
            )
        elif plot_type == 'mean_ci':
            result = prepare_mean_ci_data(
                df,
                variables.get('numeric'),
                variables.get('categorical')
            )
        elif plot_type == 'barplot':
            result = prepare_barplot_data(
                df,
                variables.get('categorical_main'),
                variables.get('categorical_stack')
            )
        elif plot_type == 'scatter':
            result = prepare_scatter_data(
                df,
                variables.get('x_axis'),
                variables.get('y_axis'),
                variables.get('categorical')
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid plot type")

        return {
            "file_id": file_id,
            "plot_type": plot_type,
            "plotly_data": result['data'],
            "plotly_layout": result['layout']
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 1.4 Dependencies
No new backend dependencies needed! We already have:
- `scipy` - for stats calculations (mean CI)
- `pandas` - for data manipulation
- `numpy` - for array operations

---

## Phase 2: Frontend Component

### 2.1 Install Plotly
```bash
cd frontend
npm install react-plotly.js plotly.js
```

### 2.2 Create Visualization component
- **File**: `/frontend/src/components/Visualization.jsx`
- **Props**:
  - `fileId` - to fetch plot data
  - `variableAnalysis` - to populate dropdowns with appropriate variables

### 2.3 Component State
```javascript
import { useState } from 'react'
import Plot from 'react-plotly.js'
import api from '../services/api'
import './Visualization.css'

export default function Visualization({ fileId, variableAnalysis }) {
  const [plotType, setPlotType] = useState('')
  const [selectedVars, setSelectedVars] = useState({
    numeric: '',
    categorical: '',
    x_axis: '',
    y_axis: '',
    categorical_main: '',
    categorical_stack: ''
  })
  const [plotData, setPlotData] = useState(null)
  const [plotLayout, setPlotLayout] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter variables by type
  const numericVars = variableAnalysis.filter(v => v.currentType === 'numeric')
  const categoricalVars = variableAnalysis.filter(v => v.currentType === 'categorical')

  const handlePlotTypeChange = (type) => {
    setPlotType(type)
    // Reset selected variables
    setSelectedVars({
      numeric: '',
      categorical: '',
      x_axis: '',
      y_axis: '',
      categorical_main: '',
      categorical_stack: ''
    })
    setPlotData(null)
    setPlotLayout(null)
    setError(null)
  }

  const validateSelections = () => {
    switch(plotType) {
      case 'histogram':
      case 'boxplot':
      case 'density':
      case 'violin':
      case 'mean_ci':
        return selectedVars.numeric !== ''
      case 'barplot':
        return selectedVars.categorical_main !== ''
      case 'scatter':
        return selectedVars.x_axis !== '' && selectedVars.y_axis !== ''
      default:
        return false
    }
  }

  const handleGeneratePlot = async () => {
    if (!validateSelections()) {
      setError('Please select all required variables')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post(`/api/visualize/${fileId}`, {
        plot_type: plotType,
        variables: selectedVars
      })

      setPlotData(response.data.plotly_data)
      setPlotLayout(response.data.plotly_layout)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate plot')
      console.error('Plot generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="visualization">
      <h2>Data Visualization</h2>
      <p className="description">
        Select a plot type and variables to create interactive visualizations.
      </p>

      <PlotTypeSelector
        selectedType={plotType}
        onChange={handlePlotTypeChange}
      />

      {plotType && (
        <VariableSelectors
          plotType={plotType}
          numericVars={numericVars}
          categoricalVars={categoricalVars}
          selectedVars={selectedVars}
          onChange={setSelectedVars}
        />
      )}

      {plotType && (
        <button
          className="generate-button"
          onClick={handleGeneratePlot}
          disabled={loading || !validateSelections()}
        >
          {loading ? 'Generating...' : 'Generate Plot'}
        </button>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {plotData && plotLayout && (
        <div className="plot-display">
          <h3>Interactive Plot</h3>
          <div className="plot-container">
            <Plot
              data={plotData}
              layout={{
                ...plotLayout,
                autosize: true,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent'
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: `${plotType}_plot`,
                  height: 800,
                  width: 1200,
                  scale: 2
                }
              }}
              style={{ width: '100%', height: '600px' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2.4 Sub-components

#### PlotTypeSelector
```jsx
function PlotTypeSelector({ selectedType, onChange }) {
  const plotTypes = [
    { value: 'histogram', label: 'Histogram', description: 'Distribution of numeric variable' },
    { value: 'boxplot', label: 'Box Plot', description: 'Box-and-whisker plot' },
    { value: 'density', label: 'Density Plot', description: 'Probability density' },
    { value: 'violin', label: 'Violin Plot', description: 'Distribution with quartiles' },
    { value: 'mean_ci', label: 'Mean ± 95% CI', description: 'Mean with confidence interval' },
    { value: 'barplot', label: 'Bar Plot', description: 'Categorical frequency' },
    { value: 'scatter', label: 'Scatter Plot', description: 'X-Y relationship' }
  ]

  return (
    <div className="plot-type-selector">
      <h3>Select Plot Type</h3>
      <div className="plot-type-grid">
        {plotTypes.map(type => (
          <button
            key={type.value}
            className={`plot-type-card ${selectedType === type.value ? 'active' : ''}`}
            onClick={() => onChange(type.value)}
          >
            <span className="plot-type-label">{type.label}</span>
            <span className="plot-type-description">{type.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

#### VariableSelectors
```jsx
function VariableSelectors({ plotType, numericVars, categoricalVars, selectedVars, onChange }) {
  const renderSelectors = () => {
    switch(plotType) {
      case 'histogram':
      case 'boxplot':
      case 'density':
      case 'violin':
      case 'mean_ci':
        return (
          <>
            <VariableDropdown
              label="Numeric Variable"
              required
              options={numericVars}
              value={selectedVars.numeric}
              onChange={(val) => onChange({...selectedVars, numeric: val})}
            />
            <VariableDropdown
              label="Group By (Optional)"
              options={categoricalVars}
              value={selectedVars.categorical}
              onChange={(val) => onChange({...selectedVars, categorical: val})}
              allowNone
            />
          </>
        )

      case 'barplot':
        return (
          <>
            <VariableDropdown
              label="Categorical Variable"
              required
              options={categoricalVars}
              value={selectedVars.categorical_main}
              onChange={(val) => onChange({...selectedVars, categorical_main: val})}
            />
            <VariableDropdown
              label="Stack/Cluster By (Optional)"
              options={categoricalVars}
              value={selectedVars.categorical_stack}
              onChange={(val) => onChange({...selectedVars, categorical_stack: val})}
              allowNone
            />
          </>
        )

      case 'scatter':
        return (
          <>
            <VariableDropdown
              label="X-Axis (Numeric)"
              required
              options={numericVars}
              value={selectedVars.x_axis}
              onChange={(val) => onChange({...selectedVars, x_axis: val})}
            />
            <VariableDropdown
              label="Y-Axis (Numeric)"
              required
              options={numericVars}
              value={selectedVars.y_axis}
              onChange={(val) => onChange({...selectedVars, y_axis: val})}
            />
            <VariableDropdown
              label="Color By (Optional)"
              options={categoricalVars}
              value={selectedVars.categorical}
              onChange={(val) => onChange({...selectedVars, categorical: val})}
              allowNone
            />
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="variable-selectors">
      <h3>Select Variables</h3>
      {renderSelectors()}
    </div>
  )
}
```

#### VariableDropdown
```jsx
function VariableDropdown({ label, required, options, value, onChange, allowNone }) {
  return (
    <div className="variable-dropdown">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Select Variable --</option>
        {options.map(v => (
          <option key={v.name} value={v.name}>{v.name}</option>
        ))}
      </select>
    </div>
  )
}
```

---

## Phase 3: Styling

### 3.1 Create Visualization.css
```css
.visualization {
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow);
  max-width: 1400px;
  margin: 0 auto;
  color: var(--text-primary);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.visualization h2 {
  margin-bottom: 8px;
  font-size: 1.6rem;
  color: var(--text-primary);
}

.description {
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 0.9rem;
}

/* Plot Type Selector */
.plot-type-selector {
  margin-bottom: 25px;
}

.plot-type-selector h3 {
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.plot-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.plot-type-card {
  background-color: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.plot-type-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.plot-type-card.active {
  border-color: #667eea;
  background-color: rgba(102, 126, 234, 0.1);
}

.plot-type-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.plot-type-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Variable Selectors */
.variable-selectors {
  margin-bottom: 20px;
}

.variable-selectors h3 {
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.variable-dropdown {
  margin-bottom: 12px;
}

.variable-dropdown label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.variable-dropdown .required {
  color: #e74c3c;
  margin-left: 2px;
}

.variable-dropdown select {
  width: 100%;
  max-width: 400px;
  padding: 10px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.variable-dropdown select:hover {
  border-color: #667eea;
}

.variable-dropdown select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Generate Button */
.generate-button {
  background-color: #667eea;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.generate-button:hover:not(:disabled) {
  background-color: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.generate-button:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Error Message */
.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-weight: 500;
}

body.dark-mode .error-message {
  background-color: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.5);
  color: #ff6b6b;
}

/* Plot Display */
.plot-display {
  margin-top: 20px;
}

.plot-display h3 {
  margin-bottom: 12px;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.plot-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

body.dark-mode .plot-container {
  background-color: #2a2a2a;
}

/* Responsive Design */
@media (max-width: 768px) {
  .visualization {
    padding: 15px;
  }

  .plot-type-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }

  .plot-type-card {
    padding: 10px;
  }

  .plot-type-label {
    font-size: 0.85rem;
  }

  .plot-type-description {
    font-size: 0.75rem;
  }

  .variable-dropdown select {
    max-width: 100%;
  }

  .plot-container {
    padding: 10px;
  }
}
```

---

## Phase 4: Integration

### 4.1 Update App.jsx
```jsx
import Visualization from './components/Visualization'

// Add navigation button after Data Summary
<button
  className={currentPage === 'visualization' ? 'active' : ''}
  onClick={() => setCurrentPage('visualization')}
>
  Visualization
</button>

// Add route
{currentPage === 'visualization' && uploadedFile && variableAnalysis && (
  <Visualization
    fileId={uploadedFile.file_id}
    variableAnalysis={variableAnalysis}
  />
)}
```

### 4.2 Update navigation flow
- Order: Upload → Data Preview → Data Types → Data Summary → **Visualization** → Analysis → Results

---

## Implementation Steps Summary

### Backend
- [ ] Implement data preparation functions:
  - [ ] `prepare_histogram_data()`
  - [ ] `prepare_boxplot_data()`
  - [ ] `prepare_violin_data()`
  - [ ] `prepare_density_data()`
  - [ ] `prepare_mean_ci_data()`
  - [ ] `prepare_barplot_data()`
  - [ ] `prepare_scatter_data()`
- [ ] Create `/api/visualize/{file_id}` POST endpoint
- [ ] Add input validation for plot type and variables
- [ ] Handle edge cases (empty data, insufficient data for CI, etc.)

### Frontend
- [ ] Install Plotly: `npm install react-plotly.js plotly.js`
- [ ] Create `Visualization.jsx` main component
- [ ] Create `PlotTypeSelector` sub-component
- [ ] Create `VariableSelectors` sub-component
- [ ] Create `VariableDropdown` sub-component
- [ ] Implement plot generation logic with API call
- [ ] Add validation (ensure required variables are selected)
- [ ] Add loading and error states
- [ ] Integrate Plotly rendering

### Styling
- [ ] Create `Visualization.css`
- [ ] Style plot type selector grid
- [ ] Style variable dropdowns
- [ ] Style plot display container
- [ ] Style generate button
- [ ] Add dark mode support
- [ ] Add responsive design for mobile

### Integration
- [ ] Add Visualization import to App.jsx
- [ ] Add "Visualization" navigation button
- [ ] Add route for visualization page
- [ ] Update navigation order

### Testing
- [ ] Test all plot types with various variable combinations
- [ ] Test with/without grouping variables
- [ ] Test error handling (invalid selections, API errors)
- [ ] Test interactive features (zoom, pan, download)
- [ ] Test on different screen sizes
- [ ] Test dark mode
- [ ] Test download functionality (built into Plotly)

---

## Phase 6: Plot Customization Editor

Add an interactive plot editor to allow users to customize plot appearance and settings.

### 6.1 Feature Categories

#### Priority 1 (MVP)
**Text & Labels:**
- Plot title
- X-axis label
- Y-axis label
- Font size (title, axis labels, tick labels)

**Axis Settings:**
- X-axis min/max limits (Auto or Custom)
- Y-axis min/max limits (Auto or Custom)
- Axis scale (Linear or Log)
- Show/hide grid lines

**Colors & Style:**
- Color palette selector (Plotly default, Viridis, Set1, Set2, etc.)
- Opacity slider (0.0 - 1.0)

**Layout:**
- Show/hide legend
- Legend position (top-left, top-right, bottom-left, bottom-right)

**Export Options:**
- Format (PNG, SVG, JPEG)
- Resolution/DPI (72, 150, 300, 600)
- Dimensions (width x height)

#### Priority 2 (Enhancement)
**Advanced Styling:**
- Font family selection
- Marker size (scatter plots)
- Line width (scatter, error bars)
- Bar width (bar plots, histograms)

**Plot-Specific Options:**
- Histogram: Number of bins or bin width
- Box/Violin: Show/hide individual points, jitter amount
- Bar plot: Bar mode (stack, group, overlay)
- Density plot: Bandwidth/smoothing parameter

**Grid & Background:**
- Grid line color and style
- Plot background color
- Paper background color
- Custom margins (top, bottom, left, right)

#### Priority 3 (Advanced)
**Annotations & References:**
- Add text annotations at custom positions
- Horizontal reference lines
- Vertical reference lines
- Highlight regions with shapes

**Statistical Overlays:**
- Regression line (scatter plots)
- Confidence band (scatter plots)
- Normal curve overlay (histogram)
- Smoothing curve (scatter plots)

---

### 6.2 UI Implementation - Accordion Editor

```jsx
// Add to Visualization.jsx after plot type and variable selection

{plotData && plotLayout && (
  <PlotCustomizationEditor
    plotType={plotType}
    plotConfig={plotConfig}
    onConfigChange={setPlotConfig}
    onApply={handleApplyCustomization}
  />
)}

function PlotCustomizationEditor({ plotType, plotConfig, onConfigChange, onApply }) {
  const [expanded, setExpanded] = useState({
    text: true,
    axis: false,
    colors: false,
    layout: false,
    specific: false
  })

  return (
    <div className="plot-customization-editor">
      <div className="editor-header">
        <h3>Customize Plot</h3>
        <button className="apply-button" onClick={onApply}>
          Apply Changes
        </button>
      </div>

      <AccordionSection
        title="Text & Labels"
        icon="📝"
        isExpanded={expanded.text}
        onToggle={() => setExpanded({...expanded, text: !expanded.text})}
      >
        <TextCustomization config={plotConfig} onChange={onConfigChange} />
      </AccordionSection>

      <AccordionSection
        title="Axis Settings"
        icon="📊"
        isExpanded={expanded.axis}
        onToggle={() => setExpanded({...expanded, axis: !expanded.axis})}
      >
        <AxisCustomization config={plotConfig} onChange={onConfigChange} />
      </AccordionSection>

      <AccordionSection
        title="Colors & Style"
        icon="🎨"
        isExpanded={expanded.colors}
        onToggle={() => setExpanded({...expanded, colors: !expanded.colors})}
      >
        <ColorCustomization config={plotConfig} onChange={onConfigChange} />
      </AccordionSection>

      <AccordionSection
        title="Layout"
        icon="📐"
        isExpanded={expanded.layout}
        onToggle={() => setExpanded({...expanded, layout: !expanded.layout})}
      >
        <LayoutCustomization config={plotConfig} onChange={onConfigChange} />
      </AccordionSection>

      <AccordionSection
        title="Plot-Specific Options"
        icon="🔧"
        isExpanded={expanded.specific}
        onToggle={() => setExpanded({...expanded, specific: !expanded.specific})}
      >
        <PlotSpecificOptions
          plotType={plotType}
          config={plotConfig}
          onChange={onConfigChange}
        />
      </AccordionSection>
    </div>
  )
}
```

---

### 6.3 Customization Components

#### TextCustomization
```jsx
function TextCustomization({ config, onChange }) {
  return (
    <div className="customization-section">
      <div className="input-group">
        <label>Plot Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({...config, title: e.target.value})}
          placeholder="Enter plot title"
        />
      </div>

      <div className="input-group">
        <label>X-Axis Label</label>
        <input
          type="text"
          value={config.xAxisLabel || ''}
          onChange={(e) => onChange({...config, xAxisLabel: e.target.value})}
          placeholder="X-axis label"
        />
      </div>

      <div className="input-group">
        <label>Y-Axis Label</label>
        <input
          type="text"
          value={config.yAxisLabel || ''}
          onChange={(e) => onChange({...config, yAxisLabel: e.target.value})}
          placeholder="Y-axis label"
        />
      </div>

      <div className="input-group">
        <label>Title Font Size</label>
        <input
          type="number"
          min="10"
          max="36"
          value={config.titleFontSize || 18}
          onChange={(e) => onChange({...config, titleFontSize: parseInt(e.target.value)})}
        />
      </div>
    </div>
  )
}
```

#### AxisCustomization
```jsx
function AxisCustomization({ config, onChange }) {
  return (
    <div className="customization-section">
      <h4>X-Axis Range</h4>
      <div className="input-row">
        <div className="input-group">
          <label>Min</label>
          <select
            value={config.xMinType || 'auto'}
            onChange={(e) => onChange({...config, xMinType: e.target.value})}
          >
            <option value="auto">Auto</option>
            <option value="custom">Custom</option>
          </select>
          {config.xMinType === 'custom' && (
            <input
              type="number"
              value={config.xMin || ''}
              onChange={(e) => onChange({...config, xMin: parseFloat(e.target.value)})}
            />
          )}
        </div>

        <div className="input-group">
          <label>Max</label>
          <select
            value={config.xMaxType || 'auto'}
            onChange={(e) => onChange({...config, xMaxType: e.target.value})}
          >
            <option value="auto">Auto</option>
            <option value="custom">Custom</option>
          </select>
          {config.xMaxType === 'custom' && (
            <input
              type="number"
              value={config.xMax || ''}
              onChange={(e) => onChange({...config, xMax: parseFloat(e.target.value)})}
            />
          )}
        </div>
      </div>

      <h4>Y-Axis Range</h4>
      <div className="input-row">
        <div className="input-group">
          <label>Min</label>
          <select
            value={config.yMinType || 'auto'}
            onChange={(e) => onChange({...config, yMinType: e.target.value})}
          >
            <option value="auto">Auto</option>
            <option value="custom">Custom</option>
          </select>
          {config.yMinType === 'custom' && (
            <input
              type="number"
              value={config.yMin || ''}
              onChange={(e) => onChange({...config, yMin: parseFloat(e.target.value)})}
            />
          )}
        </div>

        <div className="input-group">
          <label>Max</label>
          <select
            value={config.yMaxType || 'auto'}
            onChange={(e) => onChange({...config, yMaxType: e.target.value})}
          >
            <option value="auto">Auto</option>
            <option value="custom">Custom</option>
          </select>
          {config.yMaxType === 'custom' && (
            <input
              type="number"
              value={config.yMax || ''}
              onChange={(e) => onChange({...config, yMax: parseFloat(e.target.value)})}
            />
          )}
        </div>
      </div>

      <div className="input-group">
        <label>
          <input
            type="checkbox"
            checked={config.showGrid !== false}
            onChange={(e) => onChange({...config, showGrid: e.target.checked})}
          />
          Show Grid Lines
        </label>
      </div>
    </div>
  )
}
```

#### ColorCustomization
```jsx
function ColorCustomization({ config, onChange }) {
  const palettes = [
    { value: 'plotly', label: 'Plotly Default' },
    { value: 'viridis', label: 'Viridis' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'set1', label: 'Set1' },
    { value: 'set2', label: 'Set2' },
    { value: 'pastel', label: 'Pastel' }
  ]

  return (
    <div className="customization-section">
      <div className="input-group">
        <label>Color Palette</label>
        <select
          value={config.colorPalette || 'plotly'}
          onChange={(e) => onChange({...config, colorPalette: e.target.value})}
        >
          {palettes.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Opacity: {config.opacity || 0.7}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.opacity || 0.7}
          onChange={(e) => onChange({...config, opacity: parseFloat(e.target.value)})}
        />
      </div>
    </div>
  )
}
```

#### LayoutCustomization
```jsx
function LayoutCustomization({ config, onChange }) {
  return (
    <div className="customization-section">
      <div className="input-group">
        <label>
          <input
            type="checkbox"
            checked={config.showLegend !== false}
            onChange={(e) => onChange({...config, showLegend: e.target.checked})}
          />
          Show Legend
        </label>
      </div>

      {config.showLegend !== false && (
        <div className="input-group">
          <label>Legend Position</label>
          <select
            value={config.legendPosition || 'top-right'}
            onChange={(e) => onChange({...config, legendPosition: e.target.value})}
          >
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>
      )}
    </div>
  )
}
```

#### PlotSpecificOptions
```jsx
function PlotSpecificOptions({ plotType, config, onChange }) {
  switch(plotType) {
    case 'histogram':
    case 'density':
      return (
        <div className="customization-section">
          <div className="input-group">
            <label>Number of Bins: {config.bins || 30}</label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config.bins || 30}
              onChange={(e) => onChange({...config, bins: parseInt(e.target.value)})}
            />
          </div>
        </div>
      )

    case 'boxplot':
    case 'violin':
      return (
        <div className="customization-section">
          <div className="input-group">
            <label>
              <input
                type="checkbox"
                checked={config.showPoints || false}
                onChange={(e) => onChange({...config, showPoints: e.target.checked})}
              />
              Show Individual Points
            </label>
          </div>
        </div>
      )

    case 'barplot':
      return (
        <div className="customization-section">
          <div className="input-group">
            <label>Bar Mode</label>
            <select
              value={config.barMode || 'group'}
              onChange={(e) => onChange({...config, barMode: e.target.value})}
            >
              <option value="stack">Stack</option>
              <option value="group">Group</option>
              <option value="overlay">Overlay</option>
            </select>
          </div>
        </div>
      )

    case 'scatter':
      return (
        <div className="customization-section">
          <div className="input-group">
            <label>Marker Size: {config.markerSize || 8}</label>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={config.markerSize || 8}
              onChange={(e) => onChange({...config, markerSize: parseInt(e.target.value)})}
            />
          </div>
        </div>
      )

    default:
      return null
  }
}
```

#### AccordionSection
```jsx
function AccordionSection({ title, icon, isExpanded, onToggle, children }) {
  return (
    <div className="accordion-section">
      <div className="accordion-header" onClick={onToggle}>
        <span className="accordion-icon">{icon}</span>
        <span className="accordion-title">{title}</span>
        <span className="accordion-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  )
}
```

---

### 6.4 Apply Customization Logic

```jsx
// In Visualization.jsx main component

const [plotConfig, setPlotConfig] = useState({
  // Text
  title: '',
  xAxisLabel: '',
  yAxisLabel: '',
  titleFontSize: 18,
  axisFontSize: 14,

  // Axis
  xMinType: 'auto',
  xMin: null,
  xMaxType: 'auto',
  xMax: null,
  yMinType: 'auto',
  yMin: null,
  yMaxType: 'auto',
  yMax: null,
  showGrid: true,

  // Colors
  colorPalette: 'plotly',
  opacity: 0.7,

  // Layout
  showLegend: true,
  legendPosition: 'top-right',

  // Plot-specific
  bins: 30,
  showPoints: false,
  barMode: 'group',
  markerSize: 8
})

const handleApplyCustomization = () => {
  // Merge user config with existing plotData and plotLayout
  const customizedLayout = {
    ...plotLayout,
    title: {
      text: plotConfig.title || plotLayout.title,
      font: { size: plotConfig.titleFontSize }
    },
    xaxis: {
      ...plotLayout.xaxis,
      title: plotConfig.xAxisLabel || plotLayout.xaxis?.title,
      range: plotConfig.xMinType === 'custom'
        ? [plotConfig.xMin, plotConfig.xMax]
        : undefined,
      showgrid: plotConfig.showGrid
    },
    yaxis: {
      ...plotLayout.yaxis,
      title: plotConfig.yAxisLabel || plotLayout.yaxis?.title,
      range: plotConfig.yMinType === 'custom'
        ? [plotConfig.yMin, plotConfig.yMax]
        : undefined,
      showgrid: plotConfig.showGrid
    },
    showlegend: plotConfig.showLegend,
    legend: {
      x: plotConfig.legendPosition.includes('right') ? 1 : 0,
      y: plotConfig.legendPosition.includes('top') ? 1 : 0,
      xanchor: plotConfig.legendPosition.includes('right') ? 'right' : 'left',
      yanchor: plotConfig.legendPosition.includes('top') ? 'top' : 'bottom'
    }
  }

  // Apply plot-specific customizations
  const customizedData = plotData.map(trace => ({
    ...trace,
    opacity: plotConfig.opacity,
    // Histogram/density specific
    ...(plotType === 'histogram' && { nbinsx: plotConfig.bins }),
    // Scatter specific
    ...(plotType === 'scatter' && {
      marker: { ...trace.marker, size: plotConfig.markerSize }
    }),
    // Box/Violin specific
    ...((plotType === 'boxplot' || plotType === 'violin') && {
      boxpoints: plotConfig.showPoints ? 'all' : false
    })
  }))

  // Update plot
  setPlotData(customizedData)
  setPlotLayout(customizedLayout)
}
```

---

### 6.5 Styling (Add to Visualization.css)

```css
/* Plot Customization Editor */
.plot-customization-editor {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.apply-button {
  background-color: #667eea;
  color: white;
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.apply-button:hover {
  background-color: #764ba2;
  transform: translateY(-1px);
}

/* Accordion Section */
.accordion-section {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.accordion-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: var(--bg-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.accordion-header:hover {
  background-color: var(--bg-tertiary);
}

.accordion-icon {
  font-size: 1.2rem;
}

.accordion-title {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.accordion-toggle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.accordion-content {
  padding: 15px;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

/* Customization Section */
.customization-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.input-group input[type="text"],
.input-group input[type="number"],
.input-group select {
  padding: 8px 10px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: #667eea;
}

.input-group input[type="range"] {
  width: 100%;
  cursor: pointer;
}

.input-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-right: 8px;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .input-row {
    grid-template-columns: 1fr;
  }
}
```

---

### 6.6 Updated Implementation Steps

#### Backend
- No backend changes needed for basic customization
- All customization handled client-side by modifying Plotly config

#### Frontend
- [ ] Add `plotConfig` state to Visualization component
- [ ] Create `PlotCustomizationEditor` component
- [ ] Create `AccordionSection` component
- [ ] Create `TextCustomization` component
- [ ] Create `AxisCustomization` component
- [ ] Create `ColorCustomization` component
- [ ] Create `LayoutCustomization` component
- [ ] Create `PlotSpecificOptions` component
- [ ] Implement `handleApplyCustomization` logic
- [ ] Add customization editor styles to CSS

#### Testing
- [ ] Test all text customizations
- [ ] Test axis range customization (auto vs custom)
- [ ] Test color palette changes
- [ ] Test opacity slider
- [ ] Test legend show/hide and positioning
- [ ] Test plot-specific options for each plot type
- [ ] Test customization persistence during variable changes
- [ ] Test responsive design on mobile

---

## Notes

- Backend sends filtered raw data per plot request
- Plotly handles all interactivity (zoom, pan, hover, download)
- Download button built into Plotly mode bar
- Plots are responsive and work in dark mode
- Error handling for insufficient data points
- Simple, clean architecture with clear separation of concerns
- **Plot customization is entirely client-side** - no additional API calls needed
- Customization state resets when plot type or variables change
- Advanced features (annotations, statistical overlays) can be added incrementally
