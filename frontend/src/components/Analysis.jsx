import { useState, useEffect } from 'react'
import api from '../services/api'
import TestTypeSelector from './TestTypeSelector'
import TestVariableSelectors from './TestVariableSelectors'
import TestResults from './TestResults'
import './Analysis.css'

// Test configuration mapping with all 10 statistical tests
// Ordered: t-test, mann-whitney U, anova, kruskal wallis, paired t-test, wilcoxon, chi square, pearson, spearman, kendall
const testConfigs = {
  ttest: {
    name: 't-Test (Independent)',
    description: 'Compare means of two independent groups',
    icon: '📊',
    requirements: [
      { key: 'numeric', type: 'numeric', label: 'Numeric Variable', required: true },
      { key: 'categorical', type: 'categorical', label: 'Group Variable (Binary)', required: true, minClasses: 2, maxClasses: 2 }
    ],
    endpoint: '/api/statistical-tests/ttest'
  },
  mann_whitney: {
    name: 'Mann-Whitney U',
    description: 'Non-parametric alternative to t-test',
    icon: '📉',
    requirements: [
      { key: 'numeric', type: 'numeric', label: 'Numeric Variable', required: true },
      { key: 'categorical', type: 'categorical', label: 'Group Variable (Binary)', required: true, minClasses: 2, maxClasses: 2 }
    ],
    endpoint: '/api/statistical-tests/mann-whitney'
  },
  anova: {
    name: 'ANOVA (One-way)',
    description: 'Compare means across 2+ groups',
    icon: '📈',
    requirements: [
      { key: 'numeric', type: 'numeric', label: 'Numeric Variable', required: true },
      { key: 'categorical', type: 'categorical', label: 'Group Variable (≥2 classes)', required: true }
    ],
    endpoint: '/api/statistical-tests/anova'
  },
  kruskal_wallis: {
    name: 'Kruskal-Wallis',
    description: 'Non-parametric ANOVA alternative',
    icon: '📊',
    requirements: [
      { key: 'numeric', type: 'numeric', label: 'Numeric Variable', required: true },
      { key: 'categorical', type: 'categorical', label: 'Group Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/kruskal-wallis'
  },
  paired_ttest: {
    name: 'Paired t-Test',
    description: 'Compare means of two paired/dependent groups',
    icon: '🔗',
    requirements: [
      { key: 'var1', type: 'numeric', label: 'First Variable', required: true },
      { key: 'var2', type: 'numeric', label: 'Second Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/paired-ttest'
  },
  wilcoxon_signed_rank: {
    name: 'Wilcoxon Signed-Rank',
    description: 'Non-parametric paired test',
    icon: '↔️',
    requirements: [
      { key: 'var1', type: 'numeric', label: 'First Variable', required: true },
      { key: 'var2', type: 'numeric', label: 'Second Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/wilcoxon-signed-rank'
  },
  chi_square: {
    name: 'Chi-Square',
    description: 'Test independence of two categorical variables',
    icon: '🔲',
    requirements: [
      { key: 'var1', type: 'categorical', label: 'First Categorical Variable', required: true },
      { key: 'var2', type: 'categorical', label: 'Second Categorical Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/chi-square'
  },
  pearson_correlation: {
    name: 'Pearson Correlation',
    description: 'Linear correlation between two numeric variables',
    icon: '📐',
    requirements: [
      { key: 'var1', type: 'numeric', label: 'First Variable', required: true },
      { key: 'var2', type: 'numeric', label: 'Second Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/pearson-correlation'
  },
  spearman_correlation: {
    name: 'Spearman Correlation',
    description: 'Rank-based correlation for non-linear relationships',
    icon: '📊',
    requirements: [
      { key: 'var1', type: 'numeric', label: 'First Variable', required: true },
      { key: 'var2', type: 'numeric', label: 'Second Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/spearman-correlation'
  },
  kendall_correlation: {
    name: 'Kendall Correlation (Tau)',
    description: 'Rank correlation coefficient for monotonic relationships',
    icon: '🔗',
    requirements: [
      { key: 'var1', type: 'numeric', label: 'First Variable', required: true },
      { key: 'var2', type: 'numeric', label: 'Second Variable', required: true }
    ],
    endpoint: '/api/statistical-tests/kendall-correlation'
  }
}

export default function Analysis({ fileId, variableAnalysis }) {
  const [selectedTest, setSelectedTest] = useState('')
  const [selectedVars, setSelectedVars] = useState({})
  const [testResults, setTestResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset variables when test type changes
  useEffect(() => {
    setSelectedVars({})
    setError(null)
    setTestResults(null)
  }, [selectedTest])

  const handleTestSelect = (testType) => {
    setSelectedTest(testType)
  }

  const handleVariableChange = (varKey, varName) => {
    setSelectedVars(prev => ({
      ...prev,
      [varKey]: varName
    }))
  }

  // Get numeric and categorical variables from analysis
  const numericVars = variableAnalysis?.filter(v => v.currentType === 'numeric') || []
  const categoricalVars = variableAnalysis?.filter(v => v.currentType === 'categorical') || []

  // Check if all required variables are selected
  const canRunTest = () => {
    if (!selectedTest) return false
    const config = testConfigs[selectedTest]
    if (!config) return false

    return config.requirements.every(req => selectedVars[req.key])
  }

  // Validate variable requirements
  const getValidationErrors = () => {
    if (!selectedTest) return []
    const config = testConfigs[selectedTest]
    const errors = []

    config.requirements.forEach(req => {
      if (req.required && !selectedVars[req.key]) {
        errors.push(`${req.label} is required`)
        return
      }

      const varName = selectedVars[req.key]
      if (!varName) return

      // Find the variable in the analysis
      const variable = variableAnalysis?.find(v => v.name === varName)
      if (!variable) return

      // Check type requirements
      if (req.type === 'numeric' && variable.currentType !== 'numeric') {
        errors.push(`${req.label} must be numeric`)
      }
      if (req.type === 'categorical' && variable.currentType !== 'categorical') {
        errors.push(`${req.label} must be categorical`)
      }

      // Check class constraints for categorical variables
      if (req.minClasses || req.maxClasses) {
        const classCount = variable.unique_values?.length || 0
        if (req.minClasses && classCount < req.minClasses) {
          errors.push(`${req.label} must have at least ${req.minClasses} classes (found ${classCount})`)
        }
        if (req.maxClasses && classCount > req.maxClasses) {
          errors.push(`${req.label} must have at most ${req.maxClasses} classes (found ${classCount})`)
        }
      }

      // Prevent duplicate variable selection
      const selectedVarNames = Object.values(selectedVars).filter(v => v)
      if (selectedVarNames.filter(v => v === varName).length > 1) {
        errors.push(`Cannot select the same variable twice`)
      }
    })

    return errors
  }

  const handleRunTest = async () => {
    const validationErrors = getValidationErrors()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '))
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const config = testConfigs[selectedTest]
      const payload = {
        file_id: fileId,
        variables: selectedVars
      }

      const response = await api.post(config.endpoint, payload)
      setTestResults(response.data)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to run statistical test'
      setError(errorMessage)
      console.error('Error running test:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!fileId || !variableAnalysis) {
    return (
      <div className="analysis">
        <h2>Statistical Tests</h2>
        <p className="no-data">Please upload a file first to perform statistical tests.</p>
      </div>
    )
  }

  const currentConfig = selectedTest ? testConfigs[selectedTest] : null
  const validationErrors = getValidationErrors()

  return (
    <div className="analysis">
      <h2>Statistical Tests</h2>
      <p className="description">
        Select a statistical test type and configure variables to analyze your data.
      </p>

      {/* Test Type Selector */}
      <TestTypeSelector
        selectedTest={selectedTest}
        onSelect={handleTestSelect}
        testConfigs={testConfigs}
      />

      {/* Variable Selectors */}
      {selectedTest && currentConfig && (
        <TestVariableSelectors
          testConfig={currentConfig}
          selectedVars={selectedVars}
          numericVars={numericVars}
          categoricalVars={categoricalVars}
          onChange={handleVariableChange}
          validationErrors={validationErrors}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Run Test Button */}
      {selectedTest && currentConfig && (
        <div className="test-actions">
          <button
            className="run-test-button"
            onClick={handleRunTest}
            disabled={!canRunTest() || isLoading}
          >
            {isLoading ? 'Running Test...' : 'Run Test'}
          </button>
        </div>
      )}

      {/* Results Display */}
      {testResults && (
        <TestResults
          results={testResults}
          testConfig={currentConfig}
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
