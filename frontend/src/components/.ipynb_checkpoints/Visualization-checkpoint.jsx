import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import api from '../services/api'
import './Visualization.css'

export default function Visualization({ fileId, variableAnalysis }) {
  const [plotType, setPlotType] = useState('')
  const [selectedVars, setSelectedVars] = useState({})
  const [plotData, setPlotData] = useState([])
  const [plotLayout, setPlotLayout] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset selected variables when plot type changes
  useEffect(() => {
    setSelectedVars({})
    setPlotData([])
    setPlotLayout({})
    setError(null)
  }, [plotType])

  // Get variables by type
  const numericVars = variableAnalysis?.filter(v => v.currentType === 'numeric') || []
  const categoricalVars = variableAnalysis?.filter(v => v.currentType === 'categorical') || []

  const handlePlotTypeSelect = (type) => {
    setPlotType(type)
  }

  const handleVariableChange = (varKey, varName) => {
    setSelectedVars(prev => ({
      ...prev,
      [varKey]: varName
    }))
  }

  // Check if all required variables are selected
  const canGeneratePlot = () => {
    if (!plotType) return false

    switch (plotType) {
      case 'histogram':
      case 'boxplot':
      case 'violin':
      case 'density':
      case 'mean_ci':
        return selectedVars.numeric
      case 'barplot':
        return selectedVars.categorical
      case 'scatter':
        return selectedVars.x_var && selectedVars.y_var
      default:
        return false
    }
  }

  const handleGeneratePlot = async () => {
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
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate plot'
      setError(errorMessage)
      console.error('Error generating plot:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate plot when variables change and are sufficient
  useEffect(() => {
    if (canGeneratePlot()) {
      handleGeneratePlot()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVars, plotType])

  return (
    <div className="visualization">
      <h2>Data Visualization</h2>
      <p className="description">
        Create interactive plots to explore your data. Select a plot type and configure the variables.
      </p>

      {!fileId || !variableAnalysis ? (
        <p className="no-data">Please upload a file first to create visualizations.</p>
      ) : (
        <>
          <PlotTypeSelector
            selectedType={plotType}
            onSelect={handlePlotTypeSelect}
          />

          {plotType && (
            <VariableSelectors
              plotType={plotType}
              selectedVars={selectedVars}
              numericVars={numericVars}
              categoricalVars={categoricalVars}
              onChange={handleVariableChange}
              loading={loading}
            />
          )}

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {plotData.length > 0 && (
            <div className="plot-container">
              <Plot
                data={plotData}
                layout={{
                  ...plotLayout,
                  autosize: true,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '600px' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PlotTypeSelector({ selectedType, onSelect }) {
  const plotTypes = [
    { id: 'histogram', name: 'Histogram', icon: '📊' },
    { id: 'boxplot', name: 'Box Plot', icon: '📦' },
    { id: 'violin', name: 'Violin Plot', icon: '🎻' },
    { id: 'density', name: 'Density Plot', icon: '〰️' },
    { id: 'mean_ci', name: 'Mean ± CI', icon: '📈' },
    { id: 'barplot', name: 'Bar Plot', icon: '📋' },
    { id: 'scatter', name: 'Scatter Plot', icon: '⚫' }
  ]

  return (
    <div className="plot-type-selector">
      <h3>Select Plot Type</h3>
      <div className="plot-type-grid">
        {plotTypes.map(type => (
          <div
            key={type.id}
            className={`plot-type-card ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => onSelect(type.id)}
          >
            <div className="plot-icon">{type.icon}</div>
            <div className="plot-name">{type.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VariableSelectors({ plotType, selectedVars, numericVars, categoricalVars, onChange, loading }) {
  const getVariableConfig = () => {
    switch (plotType) {
      case 'histogram':
      case 'boxplot':
      case 'violin':
      case 'density':
      case 'mean_ci':
        return [
          { key: 'numeric', label: 'Numeric Variable', options: numericVars, required: true },
          { key: 'categorical', label: 'Group By (Optional)', options: categoricalVars, required: false }
        ]
      case 'barplot':
        return [
          { key: 'categorical', label: 'Categorical Variable', options: categoricalVars, required: true },
          { key: 'stack_var', label: 'Stack/Cluster By (Optional)', options: categoricalVars, required: false }
        ]
      case 'scatter':
        return [
          { key: 'x_var', label: 'X Variable', options: numericVars, required: true },
          { key: 'y_var', label: 'Y Variable', options: numericVars, required: true },
          { key: 'color_var', label: 'Color By (Optional)', options: categoricalVars, required: false }
        ]
      default:
        return []
    }
  }

  const config = getVariableConfig()

  return (
    <div className="variable-selectors">
      <div className="variable-selectors-header">
        <h3>Configure Variables</h3>
        {loading && <span className="var-loading">Generating plot...</span>}
      </div>
      <div className="variable-inputs">
        {config.map(item => (
          <VariableDropdown
            key={item.key}
            label={item.label}
            options={item.options}
            value={selectedVars[item.key] || ''}
            onChange={(value) => onChange(item.key, value)}
            required={item.required}
          />
        ))}
      </div>
    </div>
  )
}

function VariableDropdown({ label, options, value, onChange, required }) {
  return (
    <div className="variable-dropdown">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="variable-select"
      >
        <option value="">-- Select Variable --</option>
        {options.map(variable => (
          <option key={variable.name} value={variable.name}>
            {variable.name}
          </option>
        ))}
      </select>
    </div>
  )
}
