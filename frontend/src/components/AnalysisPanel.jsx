import { useState } from 'react'
import api from '../services/api'
import './AnalysisPanel.css'

export default function AnalysisPanel({ fileId, onAnalysisComplete }) {
  const [analysisType, setAnalysisType] = useState('descriptive')
  const [selectedColumns, setSelectedColumns] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const analysisTypes = [
    { value: 'descriptive', label: 'Descriptive Statistics', description: 'Mean, median, std dev, quartiles' },
    { value: 'correlation', label: 'Correlation Matrix', description: 'Pearson correlation between columns' },
    { value: 'distribution', label: 'Distribution Analysis', description: 'Skewness, kurtosis, normality test' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (selectedColumns.length === 0) {
      setError('Please select at least one column')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/analyze', {
        file_id: fileId,
        analysis_type: analysisType,
        columns: selectedColumns,
      })
      onAnalysisComplete(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform analysis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="analysis-panel">
      <h2>Statistical Analysis</h2>

      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="form-group">
          <label>Analysis Type</label>
          <div className="analysis-options">
            {analysisTypes.map((type) => (
              <div key={type.value} className="option">
                <input
                  type="radio"
                  id={type.value}
                  name="analysisType"
                  value={type.value}
                  checked={analysisType === type.value}
                  onChange={(e) => setAnalysisType(e.target.value)}
                />
                <label htmlFor={type.value}>
                  <strong>{type.label}</strong>
                  <p className="description">{type.description}</p>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Select Columns to Analyze</label>
          <div className="columns-hint">
            (Select numeric columns for analysis)
          </div>
          <div className="columns-placeholder">
            <p>Column selection will be available after file upload details are loaded</p>
            <textarea
              placeholder="Enter column names separated by commas (e.g., age, weight, height)"
              value={selectedColumns.join(', ')}
              onChange={(e) => setSelectedColumns(e.target.value.split(',').map(c => c.trim()).filter(c => c))}
              rows="3"
              className="columns-input"
            />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </form>

      <div className="analysis-help">
        <h3>Analysis Guide</h3>
        <ul>
          <li><strong>Descriptive Statistics:</strong> Get summary statistics like mean, median, standard deviation</li>
          <li><strong>Correlation Matrix:</strong> Understand relationships between variables</li>
          <li><strong>Distribution Analysis:</strong> Analyze data distribution and test for normality</li>
        </ul>
      </div>
    </div>
  )
}
