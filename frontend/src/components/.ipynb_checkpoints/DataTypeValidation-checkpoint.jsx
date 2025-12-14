import { useState, useEffect } from 'react'
import api from '../services/api'
import './DataTypeValidation.css'

export default function DataTypeValidation({ fileId, onContinue }) {
  const [variables, setVariables] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVariableAnalysis = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.post(`/api/analyze-variables/${fileId}`)
        const variablesWithState = response.data.variables.map(v => ({
          ...v,
          currentType: v.detected_type,
          isModified: false
        }))
        setVariables(variablesWithState)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to analyze variables')
      } finally {
        setIsLoading(false)
      }
    }

    if (fileId) {
      fetchVariableAnalysis()
    }
  }, [fileId])

  const handleTypeChange = (index, newType) => {
    setVariables(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        currentType: newType,
        isModified: newType !== updated[index].detected_type
      }
      return updated
    })
  }

  const handleContinue = () => {
    // Pass validated types to parent
    const validatedTypes = variables.reduce((acc, v) => {
      acc[v.name] = v.currentType
      return acc
    }, {})
    onContinue(validatedTypes)
  }

  if (isLoading) {
    return (
      <div className="datatype-validation">
        <h2>Analyzing Variables...</h2>
        <p className="loading-message">Detecting data types and analyzing variables...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="datatype-validation">
        <h2>Data Type Validation</h2>
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="datatype-validation">
      <h2>Data Type Validation</h2>
      <p className="description">
        Review and validate the detected data types for each variable. Click on the type to change it manually.
      </p>

      <div className="table-container">
        <table className="datatype-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Variable Name</th>
              <th>Detected Type</th>
              <th>Missingness</th>
              <th>Unique Values</th>
              <th>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable, index) => (
              <tr key={variable.name}>
                <td className="row-number">{index + 1}</td>
                <td className="variable-name">{variable.name}</td>
                <td className="type-cell">
                  <select
                    className={`type-select ${variable.isModified ? 'modified' : ''}`}
                    value={variable.currentType}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                  >
                    <option value="numeric">Numeric</option>
                    <option value="categorical">Categorical</option>
                    <option value="date">Date</option>
                    <option value="text">Text</option>
                  </select>
                  {variable.isModified && <span className="modified-indicator">*</span>}
                </td>
                <td className="missingness">
                  {variable.missingness} ({variable.missingness_percent}%)
                </td>
                <td className="unique-count">{variable.unique_count}</td>
                <td className="sample-values">
                  <div className="sample-pills">
                    {variable.sample_values.slice(0, 5).map((val, i) => (
                      <span key={i} className="sample-pill">{val}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button className="continue-button" onClick={handleContinue}>
          Continue to Analysis
        </button>
      </div>

      <div className="help-section">
        <h3>Data Type Descriptions</h3>
        <ul>
          <li><strong>Numeric:</strong> Continuous numbers that can be used in calculations (e.g., age, price, temperature)</li>
          <li><strong>Categorical:</strong> Discrete categories or groups (e.g., gender, color, country)</li>
          <li><strong>Date:</strong> Date or datetime values (e.g., 2024-01-15, 01/15/2024)</li>
          <li><strong>Text:</strong> Free-form text that doesn't fit other categories</li>
        </ul>
        <p className="note">* Asterisk indicates manually modified type</p>
      </div>
    </div>
  )
}
