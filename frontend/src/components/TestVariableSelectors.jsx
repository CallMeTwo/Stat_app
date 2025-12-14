export default function TestVariableSelectors({
  testConfig,
  selectedVars,
  numericVars,
  categoricalVars,
  onChange,
  validationErrors
}) {
  const getAvailableVariables = (requirement) => {
    let variables = []

    if (requirement.type === 'numeric') {
      variables = numericVars
    } else if (requirement.type === 'categorical') {
      variables = categoricalVars
    }

    // Filter by class constraints if specified
    if (requirement.minClasses || requirement.maxClasses) {
      variables = variables.filter(v => {
        const classCount = v.unique_values?.length || 0
        const meetsMin = !requirement.minClasses || classCount >= requirement.minClasses
        const meetsMax = !requirement.maxClasses || classCount <= requirement.maxClasses
        return meetsMin && meetsMax
      })
    }

    return variables
  }

  const getVariableDescription = (variable) => {
    if (!variable) return ''
    if (variable.currentType === 'numeric') {
      return `Range: ${variable.min?.toFixed(2) || '?'} - ${variable.max?.toFixed(2) || '?'}`
    } else {
      const classCount = variable.unique_values?.length || 0
      return `${classCount} classes`
    }
  }

  return (
    <div className="test-variable-selectors">
      <div className="variable-selectors-header">
        <h3>Configure Variables</h3>
      </div>

      <div className="variable-inputs">
        {testConfig.requirements.map(req => {
          const availableVars = getAvailableVariables(req)
          const selectedVar = selectedVars[req.key]
          const selectedVarObj = availableVars.find(v => v.name === selectedVar)

          return (
            <div key={req.key} className="variable-dropdown">
              <label>
                {req.label}
                {req.required && <span className="required">*</span>}
              </label>

              <select
                value={selectedVar || ''}
                onChange={(e) => onChange(req.key, e.target.value)}
                className="variable-select"
              >
                <option value="">-- Select Variable --</option>
                {availableVars.map(variable => (
                  <option key={variable.name} value={variable.name}>
                    {variable.name}
                  </option>
                ))}
              </select>

              {selectedVarObj && (
                <div className="variable-info">
                  {getVariableDescription(selectedVarObj)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
