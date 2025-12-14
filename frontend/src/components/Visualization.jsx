import { useState, useEffect } from 'react'
import api from '../services/api'
import { HistogramChart } from './charts/HistogramChart'
import { BoxChart } from './charts/BoxChart'
import { DensityChart } from './charts/DensityChart'
import { MeanCIChart } from './charts/MeanCIChart'
import { BarChartComponent } from './charts/BarChartComponent'
import { ScatterChartComponent } from './charts/ScatterChart'
import './Visualization.css'

export default function Visualization({ fileId, variableAnalysis }) {
  const [plotType, setPlotType] = useState('')
  const [selectedVars, setSelectedVars] = useState({})
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [barPlotSettings, setBarPlotSettings] = useState({
    displayMode: 'stack',
    valueType: 'count'
  })

  // Reset selected variables when plot type changes
  useEffect(() => {
    setSelectedVars({})
    setError(null)
    // Reset bar plot settings when plot type changes
    if (plotType !== 'barplot') {
      setBarPlotSettings({
        displayMode: 'stack',
        valueType: 'count'
      })
    }
  }, [plotType])

  // Load raw data once when component mounts
  useEffect(() => {
    if (!dataLoaded && fileId) {
      fetchRawData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, dataLoaded])

  const fetchRawData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/api/data/${fileId}`)
      setRawData(response.data.data || [])
      setDataLoaded(true)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load data'
      setError(errorMessage)
      console.error('Error loading raw data:', err)
    } finally {
      setLoading(false)
    }
  }

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
  const canRenderPlot = () => {
    if (!plotType || !rawData || rawData.length === 0) return false

    switch (plotType) {
      case 'histogram':
      case 'boxplot':
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

  const renderChart = () => {
    if (!canRenderPlot()) return null

    const commonProps = {
      data: rawData,
      selectedVars,
    }

    switch (plotType) {
      case 'histogram':
        return <HistogramChart {...commonProps} groupVar={selectedVars.categorical} />
      case 'boxplot':
        return <BoxChart {...commonProps} groupVar={selectedVars.categorical} />
      case 'density':
        return <DensityChart {...commonProps} groupVar={selectedVars.categorical} />
      case 'mean_ci':
        return <MeanCIChart {...commonProps} groupVar={selectedVars.categorical} />
      case 'barplot':
        return (
          <BarChartComponent
            {...commonProps}
            stackVar={selectedVars.stack_var}
            displayMode={barPlotSettings.displayMode}
            valueType={barPlotSettings.valueType}
          />
        )
      case 'scatter':
        return <ScatterChartComponent {...commonProps} colorVar={selectedVars.color_var} />
      default:
        return null
    }
  }

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
          {loading && <p className="loading-message">Loading data...</p>}

          <PlotTypeSelector
            selectedType={plotType}
            onSelect={handlePlotTypeSelect}
          />

          {plotType && (
            <>
              <VariableSelectors
                plotType={plotType}
                selectedVars={selectedVars}
                numericVars={numericVars}
                categoricalVars={categoricalVars}
                onChange={handleVariableChange}
              />
              {plotType === 'barplot' && (
                <BarPlotSettings
                  settings={barPlotSettings}
                  onChange={(key, value) =>
                    setBarPlotSettings(prev => ({
                      ...prev,
                      [key]: value
                    }))
                  }
                />
              )}
            </>
          )}

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {canRenderPlot() && (
            <div className="plot-container">
              {renderChart()}
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

function VariableSelectors({ plotType, selectedVars, numericVars, categoricalVars, onChange }) {
  const getVariableConfig = () => {
    switch (plotType) {
      case 'histogram':
      case 'boxplot':
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

function BarPlotSettings({ settings, onChange }) {
  return (
    <div className="bar-plot-settings">
      <h3>Bar Plot Settings</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <label>Display Mode</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="stack"
                checked={settings.displayMode === 'stack'}
                onChange={(e) => onChange('displayMode', e.target.value)}
              />
              Stacked
            </label>
            <label>
              <input
                type="radio"
                value="cluster"
                checked={settings.displayMode === 'cluster'}
                onChange={(e) => onChange('displayMode', e.target.value)}
              />
              Clustered
            </label>
          </div>
        </div>

        <div className="setting-group">
          <label>Value Type</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="count"
                checked={settings.valueType === 'count'}
                onChange={(e) => onChange('valueType', e.target.value)}
              />
              Count
            </label>
            <label>
              <input
                type="radio"
                value="percentage"
                checked={settings.valueType === 'percentage'}
                onChange={(e) => onChange('valueType', e.target.value)}
              />
              Percentage
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
