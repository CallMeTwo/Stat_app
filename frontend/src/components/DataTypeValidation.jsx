import './DataTypeValidation.css'

export default function DataTypeValidation({ variableAnalysis, onVariableTypesChanged }) {
  const handleTypeChange = (index, newType) => {
    const updated = [...variableAnalysis]
    updated[index] = {
      ...updated[index],
      currentType: newType,
      isModified: newType !== updated[index].detected_type
    }
    onVariableTypesChanged(updated)
  }

  if (!variableAnalysis || variableAnalysis.length === 0) {
    return (
      <div className="datatype-validation">
        <h2>Data Type Validation</h2>
        <p className="loading-message">Loading variable analysis...</p>
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
            {variableAnalysis.map((variable, index) => (
              <tr key={variable.name}>
                <td className="row-number">{index + 1}</td>
                <td className="variable-name">{variable.name}</td>
                <td className="type-cell">
                  <div className="type-content">
                    <select
                      className="type-select"
                      value={variable.currentType}
                      onChange={(e) => handleTypeChange(index, e.target.value)}
                    >
                      <option value="numeric">Numeric</option>
                      <option value="categorical">Categorical</option>
                      <option value="date">Date</option>
                      <option value="text">Text</option>
                    </select>
                    {variable.isModified && (
                      <div className="modification-info">
                        <span className="modified-indicator">*</span>
                        <span className="original-type-badge">detected: {variable.detected_type}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="missingness">
                  {variable.missingness} ({variable.missingness_percent}%)
                </td>
                <td className="unique-count">{variable.unique_count}</td>
                <td className="sample-values">
                  <div className="sample-pills">
                    {variable.sample_values.slice(0, 5).map((val, i) => (
                      <span key={i} className="sample-pill" title={val}>
                        {val}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
