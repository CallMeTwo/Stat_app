import { useState, useEffect } from 'react'
import api from '../services/api'
import RegressionTypeSelector from './RegressionTypeSelector'
import RegressionVariableSelectors from './RegressionVariableSelectors'
import RegressionResults from './RegressionResults'
import './Regression.css'

// Regression configuration mapping
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

export default function Regression({ fileId, variableAnalysis }) {
  const [selectedRegression, setSelectedRegression] = useState('')
  const [selectedVars, setSelectedVars] = useState({ dependent: '', independent: [] })
  const [regressionResults, setRegressionResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset variables when regression type changes
  useEffect(() => {
    setSelectedVars({ dependent: '', independent: [] })
    setError(null)
    setRegressionResults(null)
  }, [selectedRegression])

  const handleRegressionSelect = (regressionType) => {
    setSelectedRegression(regressionType)
  }

  const handleVariableChange = (varKey, varValue) => {
    if (varKey === 'independent') {
      setSelectedVars(prev => ({
        ...prev,
        independent: varValue
      }))
    } else {
      setSelectedVars(prev => ({
        ...prev,
        [varKey]: varValue
      }))
    }
  }

  // Get numeric and categorical variables from analysis
  const numericVars = variableAnalysis?.filter(v => v.currentType === 'numeric') || []
  const categoricalVars = variableAnalysis?.filter(v => v.currentType === 'categorical') || []

  // Check if all required variables are selected
  const canRunRegression = () => {
    if (!selectedRegression) return false
    const config = regressionConfigs[selectedRegression]
    if (!config) return false

    // Check dependent variable
    if (!selectedVars.dependent) return false

    // Check independent variables (at least one)
    if (!selectedVars.independent || selectedVars.independent.length === 0) return false

    // Validate dependent variable constraints
    const depVar = variableAnalysis?.find(v => v.name === selectedVars.dependent)
    if (!depVar) return false

    const depReq = config.requirements.find(r => r.key === 'dependent')
    if (depReq?.type === 'numeric' && depVar.currentType !== 'numeric') return false
    if (depReq?.type === 'categorical' && depVar.currentType !== 'categorical') return false

    if (depReq?.minClasses || depReq?.maxClasses) {
      const classCount = depVar.unique_values?.length || 0
      if (depReq?.minClasses && classCount < depReq.minClasses) return false
      if (depReq?.maxClasses && classCount > depReq.maxClasses) return false
    }

    // Prevent dependent var from being in independent vars
    if (selectedVars.independent.includes(selectedVars.dependent)) return false

    return true
  }

  const handleRunRegression = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const config = regressionConfigs[selectedRegression]
      const payload = {
        file_id: fileId,
        variables: selectedVars
      }

      const response = await api.post(config.endpoint, payload)
      setRegressionResults(response.data)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to run regression'
      setError(errorMessage)
      console.error('Error running regression:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!fileId || !variableAnalysis) {
    return (
      <div className="regression">
        <h2>Regression Analysis</h2>
        <p className="no-data">Please upload a file first to perform regression analysis.</p>
      </div>
    )
  }

  const currentConfig = selectedRegression ? regressionConfigs[selectedRegression] : null

  return (
    <div className="regression">
      <h2>Regression Analysis</h2>
      <p className="description">
        Select a regression type and configure variables to build a predictive model.
      </p>

      {/* Regression Type Selector */}
      <RegressionTypeSelector
        selectedRegression={selectedRegression}
        onSelect={handleRegressionSelect}
        regressionConfigs={regressionConfigs}
      />

      {/* Variable Selectors */}
      {selectedRegression && currentConfig && (
        <RegressionVariableSelectors
          regressionConfig={currentConfig}
          selectedVars={selectedVars}
          numericVars={numericVars}
          categoricalVars={categoricalVars}
          onChange={handleVariableChange}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Run Regression Button */}
      {selectedRegression && currentConfig && (
        <div className="regression-actions">
          <button
            className="run-regression-button"
            onClick={handleRunRegression}
            disabled={!canRunRegression() || isLoading}
          >
            {isLoading ? 'Running Regression...' : 'Run Regression'}
          </button>
        </div>
      )}

      {/* Results Display */}
      {regressionResults && (
        <RegressionResults
          results={regressionResults}
          regressionConfig={currentConfig}
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-message">
          Running {currentConfig?.name}... Please wait.
        </div>
      )}
    </div>
  )
}
