export default function RegressionVariableSelectors({
  regressionConfig,
  selectedVars,
  numericVars,
  categoricalVars,
  onChange
}) {
  const getAvailableVariables = (type) => {
    if (type === 'numeric') {
      return numericVars
    } else if (type === 'categorical') {
      return categoricalVars
    } else if (type === 'any') {
      return [...numericVars, ...categoricalVars]
    }
    return []
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

  const getDependentRequirement = () => {
    return regressionConfig.requirements.find(r => r.key === 'dependent')
  }

  const getIndependentRequirement = () => {
    return regressionConfig.requirements.find(r => r.key === 'independent')
  }

  const dependentReq = getDependentRequirement()
  const independentReq = getIndependentRequirement()

  return (
    <div className="regression-variable-selectors">
      <div className="variable-selectors-header">
        <h3>Configure Variables</h3>
      </div>

      <div className="variable-inputs">
        {/* Dependent Variable */}
        {dependentReq && (
          <div className="variable-section">
            <div className="variable-dropdown">
              <label>
                {dependentReq.label}
                {dependentReq.required && <span className="required">*</span>}
              </label>

              <select
                value={selectedVars.dependent || ''}
                onChange={(e) => onChange('dependent', e.target.value)}
                className="variable-select"
              >
                <option value="">-- Select Variable --</option>
                {getAvailableVariables(dependentReq.type).map(variable => {
                  const classCount = variable.unique_values?.length || 0
                  const meetsMin = !dependentReq.minClasses || classCount >= dependentReq.minClasses
                  const meetsMax = !dependentReq.maxClasses || classCount <= dependentReq.maxClasses
                  const isValid = dependentReq.type === 'numeric' || (meetsMin && meetsMax)

                  return isValid ? (
                    <option key={variable.name} value={variable.name}>
                      {variable.name}
                    </option>
                  ) : null
                })}
              </select>

              {selectedVars.dependent && (
                <div className="variable-info">
                  {getVariableDescription(
                    getAvailableVariables(dependentReq.type).find(v => v.name === selectedVars.dependent)
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Independent Variables */}
        {independentReq && (
          <div className="variable-section">
            <div className="variable-multi-select">
              <label>
                {independentReq.label}
                {independentReq.required && <span className="required">*</span>}
              </label>

              <div className="multi-select-controls">
                <select
                  onChange={(e) => {
                    if (e.target.value && !selectedVars.independent?.includes(e.target.value)) {
                      onChange('independent', [...(selectedVars.independent || []), e.target.value])
                      e.target.value = ''
                    }
                  }}
                  className="variable-select"
                  value=""
                >
                  <option value="">+ Add Variable</option>
                  {getAvailableVariables(independentReq.type)
                    .filter(v => v.name !== selectedVars.dependent)
                    .filter(v => !selectedVars.independent?.includes(v.name))
                    .map(variable => (
                      <option key={variable.name} value={variable.name}>
                        {variable.name}
                      </option>
                    ))}
                </select>
              </div>

              {selectedVars.independent && selectedVars.independent.length > 0 && (
                <div className="selected-variables">
                  {selectedVars.independent.map(varName => {
                    const variable = getAvailableVariables(independentReq.type).find(v => v.name === varName)
                    return (
                      <div key={varName} className="selected-variable-tag">
                        <span className="tag-name">{varName}</span>
                        <span className="tag-info">({getVariableDescription(variable)})</span>
                        <button
                          className="tag-remove"
                          onClick={() =>
                            onChange('independent', selectedVars.independent.filter(v => v !== varName))
                          }
                          title="Remove variable"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
