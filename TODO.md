# Plotly → Recharts Migration Plan

## Overview
Migrate from Plotly.js to Recharts for visualization. Change from backend-prepared data (API) to raw full dataframe sent to frontend. This approach is better for small datasets and provides instant plot generation without API latency.

## Current State (Plotly)
- Backend: 7 plot preparation functions returning Plotly-ready JSON
- Frontend: API calls to `/api/visualize/{file_id}` for each plot
- Data: Server-side filtered/aggregated per plot type
- Bundle: Plotly.js lazily loaded (~12.8MB)

## Target State (Recharts)
- Backend: Send raw dataframe as JSON once on file upload
- Frontend: Client-side data transformation for each plot type
- Data: Full raw dataset stored in React state
- Bundle: Recharts tree-shakeable imports (~150KB)
- Performance: Instant plot rendering, no API latency

---

## Phase 1: Setup & Dependencies

### 1.1 Install Recharts
- Remove `react-plotly.js` and `plotly.js` from package.json
- Install `recharts` package
- Verify bundle size reduction

### 1.2 Create Chart Component Structure
- Create separate component files for each chart type:
  - `HistogramChart.jsx`
  - `BoxChart.jsx`
  - `DensityChart.jsx`
  - `MeanCIChart.jsx`
  - `BarChart.jsx`
  - `ScatterChart.jsx`
- Each imports only needed Recharts components (enables tree-shaking)

### 1.3 Update Backend

#### 1.3.1 Add raw data endpoint
- Create `/api/data/{file_id}` endpoint (if not exists)
- Returns raw dataframe as JSON array
- Call this once on file upload or when navigating to Visualization tab

#### 1.3.2 Remove visualization endpoints
- Delete `/api/visualize/{file_id}` endpoint
- Delete all 7 `prepare_*_data()` functions (histogram, boxplot, violin, density, mean_ci, barplot, scatter)
- Delete `get_legend_config()` helper function

---

## Phase 2: Frontend Data Management

### 2.1 Update Visualization Component
- Remove API calls in `handleGeneratePlot()`
- Replace with client-side data transformations
- Store raw dataframe in React state: `const [rawData, setRawData] = useState([])`
- Load raw data once when entering Visualization tab

### 2.2 Create Data Transformation Functions
For each plot type, create functions to transform raw data for Recharts:

#### 2.2.1 Histogram
- Input: numeric variable, optional group variable
- Process: Create bins using Freedman-Diaconis rule (port from Python)
- Output: `[{ bin: "0-10", count: 5, group: "A" }, ...]`

#### 2.2.2 Box Plot
- Input: numeric variable, optional group variable
- Process: Calculate Q1, Q2, Q3, IQR, whiskers
- Output: `[{ group: "A", q1: 10, q2: 20, q3: 30, lower: 5, upper: 35 }, ...]`

#### 2.2.3 Density Plot
- Input: numeric variable, optional group variable
- Process: Implement KDE (kernel density estimation) in JavaScript
  - Use `simple-statistics` or `jstat` library for KDE
  - Generate 200 points across data range
- Output: `[{ x: 0, density: 0.05, group: "A" }, ...]`

#### 2.2.4 Mean ± 95% CI
- Input: numeric variable, optional group variable
- Process: Calculate mean, standard error, 95% CI
- Output: `[{ group: "A", mean: 25, errorLow: 20, errorHigh: 30 }, ...]`

#### 2.2.5 Bar Plot
- Input: categorical variable, optional stack variable
- Process: Count frequencies by category
- Output: `[{ category: "A", count: 5, stackGroup: "X" }, ...]`

#### 2.2.6 Scatter Plot
- Input: 2 numeric variables, optional color variable
- Process: Filter out rows with missing values
- Output: `[{ x: 10, y: 20, group: "A" }, ...]`

---

## Phase 3: Recharts Components Implementation

### 3.1 Create Chart Components
Each component receives transformed data and rendered configuration:

```jsx
// Example structure
function HistogramChart({ data, selectedVars, groupVar }) {
  const transformedData = transformHistogramData(data, selectedVars.numeric, groupVar)

  return (
    <ResponsiveContainer width="100%" height={600}>
      <BarChart data={transformedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bin" />
        <YAxis />
        <Tooltip />
        <Legend />
        {/* Dynamic Bar components for each group */}
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### 3.2 Handle Grouped Visualizations
- For plots with grouping: Generate multiple data series
- Use Recharts' built-in group/stack handling
- Implement dynamic legend with group names

### 3.3 Styling & Configuration
- Use theme colors consistent with app (CSS variables)
- Legend positioning: horizontal, bottom, outside plot area
- Responsive sizing with ResponsiveContainer
- Custom tooltips for better UX

---

## Phase 4: Update Visualization.jsx

### 4.1 Remove Plotly dependencies
- Remove `lazy()` and `Suspense` imports for Plot
- Remove `const Plot = lazy(() => import('react-plotly.js'))`
- Remove preload trigger code

### 4.2 Load raw data once
```jsx
// On Visualization tab first render
useEffect(() => {
  if (!dataLoaded) {
    fetchRawData(fileId)
    setDataLoaded(true)
  }
}, [])
```

### 4.3 Replace plot rendering
- Remove Plotly `<Plot>` component
- Import and render appropriate Recharts chart component based on `plotType`
- Pass `rawData`, `selectedVars`, and configuration

### 4.4 Remove loading indicators
- No API call latency, so no "Generating plot..." needed
- Plots render instantly on variable selection

---

## Phase 5: Testing & Optimization

### 5.1 Test all 6 plot types
- Histogram with/without grouping
- Box Plot with/without grouping
- Density Plot with/without grouping
- Mean ± CI with/without grouping
- Bar Plot with/without stacking
- Scatter Plot with/without coloring
- Edge cases: single value, all same values, missing data

### 5.2 Performance testing
- Measure initial bundle size
- Test with datasets: 100, 1K, 10K, 50K rows
- Identify where performance degrades
- Profile client-side computations

### 5.3 Bundle analysis
- Verify tree-shaking working (only imported components included)
- Compare final bundle sizes: Plotly vs Recharts
- Expected Recharts bundle: ~150KB vs Plotly ~12.8MB

---

## Phase 6: Cleanup & Documentation

### 6.1 Remove old files
- Delete unused backend visualization functions
- Delete any Plotly-related utilities

### 6.2 Update comments & documentation
- Document data transformation functions
- Add comments explaining chart configuration

### 6.3 Update README
- Document architecture change
- Note performance improvements
- Document client-side data transformation approach

---

## Dependencies to Add
- `recharts` - Main charting library
- Optional: `jstat` or `simple-statistics` for KDE calculations
- Optional: `lodash` for utility functions (if not already present)

## Dependencies to Remove
- `react-plotly.js`
- `plotly.js`

---

## Estimated Implementation Time
- Phase 1: 30 mins
- Phase 2: 2-3 hours (data transformation logic)
- Phase 3: 2-3 hours (chart components)
- Phase 4: 1 hour (integration)
- Phase 5: 1-2 hours (testing)
- Phase 6: 30 mins
- **Total: 7-10 hours**

---

## Key Advantages of This Migration
✅ Smaller bundle size (~150KB vs 12.8MB)
✅ Instant plot generation (no API latency)
✅ Works offline
✅ Better for small datasets (<50K rows)
✅ Simpler architecture (no backend plotting logic)
✅ Full dataset visibility for filtering/analysis

## Potential Challenges
⚠️ Client-side computation limits (very large datasets)
⚠️ Need to implement KDE and statistical calculations in JS
⚠️ Data privacy: full raw data visible to client

## Solution if Dataset Becomes Too Large
If future requirement is to handle >50K rows:
- Keep hybrid approach: raw data for small uploads, API for large uploads
- Implement threshold: if rows > 50K, revert to API + aggregated data
