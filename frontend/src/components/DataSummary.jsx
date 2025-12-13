import { useState, useEffect, useMemo } from 'react'
import './DataSummary.css'

export default function DataSummary({ variableAnalysis, summaryData }) {
  const [dateRounding, setDateRounding] = useState({})
  const [textSampleKeys, setTextSampleKeys] = useState({}) // Trigger re-sampling
  const [sortConfig, setSortConfig] = useState({})
  const [expandedVars, setExpandedVars] = useState({}) // Track which cards are expanded

  // Initialize state when component mounts or variableAnalysis changes
  useEffect(() => {
    if (!variableAnalysis || variableAnalysis.length === 0) return

    // Initialize default date rounding and sample keys
    const initialRounding = {}
    const initialSampleKeys = {}
    const initialExpanded = {}

    variableAnalysis.forEach(v => {
      if (v.currentType === 'date') {
        initialRounding[v.name] = 'year' // Default to year
      }
      if (v.currentType === 'text') {
        initialSampleKeys[v.name] = 0 // Initial sample key
      }
      initialExpanded[v.name] = true // All cards expanded by default
    })

    setDateRounding(initialRounding)
    setTextSampleKeys(initialSampleKeys)
    setExpandedVars(initialExpanded)
  }, [variableAnalysis])

  // Round date to specified unit (year, month, or day)
  const roundDate = (dateStr, unit) => {
    const d = new Date(dateStr)
    switch(unit) {
      case 'year':
        return d.getFullYear().toString()
      case 'month':
        return dateStr.slice(0, 7) // YYYY-MM
      case 'day':
        return dateStr // YYYY-MM-DD (already in this format)
      default:
        return dateStr
    }
  }

  // Compute frequency table from raw dates with specified rounding
  const computeDateFrequency = (rawDates, rounding) => {
    if (!rawDates || rawDates.length === 0) return []

    // Round all dates
    const roundedDates = rawDates.map(d => roundDate(d, rounding))

    // Count occurrences
    const counts = {}
    roundedDates.forEach(d => {
      counts[d] = (counts[d] || 0) + 1
    })

    // Convert to frequency table format
    const total = roundedDates.length
    const frequencyTable = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(2))
    }))

    return frequencyTable
  }

  // Randomly sample N items from array (seeded by key for consistency)
  const sampleRandomItems = (items, n, key = 0) => {
    if (!items || items.length === 0) return []

    const sampleSize = Math.min(n, items.length)

    // Simple seeded shuffle using the key
    const shuffled = [...items]
    let seed = key
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Simple seeded random using sine
      seed = (seed * 9301 + 49297) % 233280
      const random = seed / 233280
      const j = Math.floor(random * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled.slice(0, sampleSize)
  }


  const handleDateRoundingChange = (varName, rounding) => {
    // Just update rounding state - no API call needed
    // The frequency table will be recomputed on-demand in renderDateSummary
    setDateRounding(prev => ({
      ...prev,
      [varName]: rounding
    }))
  }

  const handleResample = (varName) => {
    // Increment sample key to trigger new random sample
    setTextSampleKeys(prev => ({
      ...prev,
      [varName]: (prev[varName] || 0) + 1
    }))
  }

  const handleSort = (varName, column) => {
    setSortConfig(prev => {
      const currentSort = prev[varName] || { column: 'name', direction: 'asc' }

      // Toggle direction if same column, otherwise reset to asc
      const newDirection = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc'

      return {
        ...prev,
        [varName]: { column, direction: newDirection }
      }
    })
  }

  const toggleExpanded = (varName) => {
    setExpandedVars(prev => ({
      ...prev,
      [varName]: !prev[varName]
    }))
  }

  const renderSortIcon = (column, currentSort) => {
    if (currentSort.column !== column) return ' ↕'
    return currentSort.direction === 'asc' ? ' ↑' : ' ↓'
  }

  const renderNumericSummary = (variable, summary) => {
    return (
      <div className="numeric-summary">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Mean</span>
            <span className="stat-value">{summary.mean !== null ? summary.mean.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">SD</span>
            <span className="stat-value">{summary.sd !== null ? summary.sd.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Median</span>
            <span className="stat-value">{summary.median !== null ? summary.median.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Q1</span>
            <span className="stat-value">{summary.q1 !== null ? summary.q1.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Q3</span>
            <span className="stat-value">{summary.q3 !== null ? summary.q3.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Min</span>
            <span className="stat-value">{summary.min !== null ? summary.min.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max</span>
            <span className="stat-value">{summary.max !== null ? summary.max.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Missingness</span>
            <span className="stat-value">{summary.missing_count} ({summary.missing_percent}%)</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Kurtosis</span>
            <span className="stat-value">{summary.kurtosis !== null ? summary.kurtosis.toFixed(4) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Skewness</span>
            <span className="stat-value">{summary.skewness !== null ? summary.skewness.toFixed(4) : 'N/A'}</span>
          </div>
        </div>

        <div className="test-results">
          <h4>Normality Tests</h4>
          <div className="test-grid">
            <div className="test-result">
              <span className="test-name">Shapiro-Wilk</span>
              {summary.shapiro_stat !== null ? (
                <div className="test-values">
                  <span>Statistic: {summary.shapiro_stat.toFixed(4)}</span>
                  <span className={summary.shapiro_p < 0.05 ? 'p-significant' : 'p-normal'}>
                    p-value: {summary.shapiro_p.toFixed(4)}
                  </span>
                </div>
              ) : (
                <span className="test-na">N/A</span>
              )}
            </div>
            <div className="test-result">
              <span className="test-name">Jarque-Bera</span>
              {summary.jb_stat !== null ? (
                <div className="test-values">
                  <span>Statistic: {summary.jb_stat.toFixed(4)}</span>
                  <span className={summary.jb_p < 0.05 ? 'p-significant' : 'p-normal'}>
                    p-value: {summary.jb_p.toFixed(4)}
                  </span>
                </div>
              ) : (
                <span className="test-na">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCategoricalSummary = (variable, summary) => {
    return (
      <div className="categorical-summary">
        <div className="basic-stats">
          <div className="stat-item">
            <span className="stat-label">Unique Classes</span>
            <span className="stat-value">{summary.unique_count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Missingness</span>
            <span className="stat-value">{summary.missing_count} ({summary.missing_percent}%)</span>
          </div>
        </div>
        <SortableFrequencyTable
          data={summary.frequency_table}
          variableName={variable.name}
          sortConfig={sortConfig}
          onSort={handleSort}
          renderSortIcon={renderSortIcon}
        />
      </div>
    )
  }

  const renderDateSummary = (variable, summary) => {
    // Compute frequency table on-demand based on current rounding
    const currentRounding = dateRounding[variable.name] || 'year'
    const frequencyTable = computeDateFrequency(summary.raw_dates, currentRounding)

    return (
      <div className="date-summary">
        <div className="basic-stats">
          <div className="stat-item">
            <span className="stat-label">Min Date</span>
            <span className="stat-value">{summary.min_date || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Date</span>
            <span className="stat-value">{summary.max_date || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Missingness</span>
            <span className="stat-value">{summary.missing_count} ({summary.missing_percent}%)</span>
          </div>
        </div>
        <DateRoundingSelector
          variableName={variable.name}
          currentRounding={currentRounding}
          onChange={handleDateRoundingChange}
        />
        <SortableFrequencyTable
          data={frequencyTable}
          variableName={variable.name}
          sortConfig={sortConfig}
          onSort={handleSort}
          renderSortIcon={renderSortIcon}
        />
      </div>
    )
  }

  const renderTextSummary = (variable, summary) => {
    // Sample on-demand from raw values
    const sampleKey = textSampleKeys[variable.name] || 0
    const samples = sampleRandomItems(summary.raw_values, 5, sampleKey)

    return (
      <div className="text-summary">
        <div className="basic-stats">
          <div className="stat-item">
            <span className="stat-label">Missingness</span>
            <span className="stat-value">{summary.missing_count} ({summary.missing_percent}%)</span>
          </div>
        </div>
        <div className="sample-section">
          <div className="sample-header">
            <h4>Sample Values</h4>
            <button
              className="resample-button"
              onClick={() => handleResample(variable.name)}
            >
              Re-sample
            </button>
          </div>
          {samples && samples.length > 0 ? (
            <div className="text-samples-inline">
              {samples.map((sample, idx) => (
                <span key={idx} className="sample-pill">{sample}</span>
              ))}
            </div>
          ) : (
            <p className="no-samples">No samples available</p>
          )}
        </div>
      </div>
    )
  }

  const renderSummaryByType = (variable, summary) => {
    if (!summary) return <p className="no-data">No summary data available</p>

    switch (variable.currentType) {
      case 'numeric':
        return renderNumericSummary(variable, summary)
      case 'categorical':
        return renderCategoricalSummary(variable, summary)
      case 'date':
        return renderDateSummary(variable, summary)
      case 'text':
        return renderTextSummary(variable, summary)
      default:
        return <p className="no-data">Unknown variable type</p>
    }
  }

  if (!variableAnalysis || variableAnalysis.length === 0 || !summaryData) {
    return (
      <div className="data-summary">
        <h2>Data Summary</h2>
        <p className="loading-message">No summary data available</p>
      </div>
    )
  }

  return (
    <div className="data-summary">
      <h2>Data Summary</h2>
      <p className="description">
        Detailed statistics for each variable based on its type. Click on variable name to collapse/expand.
      </p>

      {variableAnalysis.map(variable => (
        <div key={variable.name} className={`variable-summary-section type-${variable.currentType} ${expandedVars[variable.name] ? 'expanded' : 'collapsed'}`}>
          <h3 className="variable-header" onClick={() => toggleExpanded(variable.name)}>
            <span className="collapse-icon">{expandedVars[variable.name] ? '▼' : '▶'}</span>
            {variable.name}
            <span className="type-badge">{variable.currentType}</span>
          </h3>
          {expandedVars[variable.name] && renderSummaryByType(variable, summaryData[variable.name])}
        </div>
      ))}
    </div>
  )
}

function SortableFrequencyTable({ data, variableName, sortConfig, onSort, renderSortIcon }) {
  const currentSort = sortConfig[variableName] || { column: 'name', direction: 'asc' }

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const sorted = [...data].sort((a, b) => {
      const aVal = a[currentSort.column]
      const bVal = b[currentSort.column]

      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else {
        comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }

      return currentSort.direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [data, currentSort])

  if (!data || data.length === 0) {
    return <p className="no-data">No frequency data available</p>
  }

  return (
    <div className="frequency-table-container">
      <table className="frequency-table">
        <thead>
          <tr>
            <th onClick={() => onSort(variableName, 'name')} className="sortable">
              Class{renderSortIcon('name', currentSort)}
            </th>
            <th onClick={() => onSort(variableName, 'count')} className="sortable">
              Count{renderSortIcon('count', currentSort)}
            </th>
            <th onClick={() => onSort(variableName, 'percentage')} className="sortable">
              Percentage{renderSortIcon('percentage', currentSort)}
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
    </div>
  )
}

function DateRoundingSelector({ variableName, currentRounding, onChange }) {
  return (
    <div className="date-rounding-selector">
      <label htmlFor={`rounding-${variableName}`}>Round to: </label>
      <select
        id={`rounding-${variableName}`}
        value={currentRounding || 'year'}
        onChange={(e) => onChange(variableName, e.target.value)}
        className="rounding-select"
      >
        <option value="year">Year</option>
        <option value="month">Month</option>
        <option value="day">Day</option>
      </select>
    </div>
  )
}
