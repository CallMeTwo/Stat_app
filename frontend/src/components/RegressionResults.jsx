export default function RegressionResults({
  results,
  regressionConfig
}) {
  if (!results) return null

  const formatNumber = (num, decimals = 4) => {
    if (num === null || num === undefined) return 'N/A'
    if (typeof num !== 'number') return num
    if (num < 0.0001 && num > 0) return num.toExponential(2)
    return num.toFixed(decimals)
  }

  const isLinear = results.regression_type === 'linear'

  return (
    <div className="regression-results">
      <div className="results-header">
        <h2>{results.regression_type === 'linear' ? 'Linear' : 'Logistic'} Regression Results</h2>
        <p className="results-subtitle">
          Dependent: <strong>{results.dependent_variable}</strong> |
          Independent: <strong>{results.independent_variables.join(', ')}</strong>
        </p>
      </div>

      {/* Model Fit Statistics */}
      <div className="results-section">
        <h3>Model Fit Statistics</h3>
        <div className="stats-grid">
          {isLinear ? (
            <>
              <div className="stat-card">
                <div className="stat-label">R²</div>
                <div className="stat-value">{formatNumber(results.model_fit.r_squared, 4)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Adjusted R²</div>
                <div className="stat-value">{formatNumber(results.model_fit.adjusted_r_squared, 4)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">F-statistic</div>
                <div className="stat-value">{formatNumber(results.model_fit.f_statistic, 3)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">F p-value</div>
                <div className="stat-value">{formatNumber(results.model_fit.f_pvalue)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">N Samples</div>
                <div className="stat-value">{results.model_fit.n_samples}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">N Predictors</div>
                <div className="stat-value">{results.model_fit.n_predictors}</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-label">McFadden's R²</div>
                <div className="stat-value">{formatNumber(results.model_fit.mcfadden_r_squared, 4)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">AIC</div>
                <div className="stat-value">{formatNumber(results.model_fit.aic, 2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">BIC</div>
                <div className="stat-value">{formatNumber(results.model_fit.bic, 2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Chi-square</div>
                <div className="stat-value">{formatNumber(results.model_fit.chi_square, 3)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Chi-square p-value</div>
                <div className="stat-value">{formatNumber(results.model_fit.chi_square_pvalue)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">N Samples</div>
                <div className="stat-value">{results.model_fit.n_samples}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Coefficients Table */}
      <div className="results-section">
        <h3>Model Coefficients</h3>
        <div className="table-container">
          <table className="coefficients-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Coefficient</th>
                <th>Std Error</th>
                <th>{isLinear ? 't-statistic' : 'z-statistic'}</th>
                <th>p-value</th>
                <th>95% CI Lower</th>
                <th>95% CI Upper</th>
                {!isLinear && <th>Odds Ratio</th>}
              </tr>
            </thead>
            <tbody>
              {results.coefficients.map((coef, idx) => (
                <tr key={idx} className={coef.p_value < 0.05 ? 'significant' : ''}>
                  <td className="var-name">{coef.variable}</td>
                  <td>{formatNumber(coef.coefficient, 4)}</td>
                  <td>{formatNumber(coef.std_error, 4)}</td>
                  <td>{formatNumber(coef.t_statistic || coef.z_statistic, 4)}</td>
                  <td>{formatNumber(coef.p_value)}</td>
                  <td>{formatNumber(coef.ci_lower, 4)}</td>
                  <td>{formatNumber(coef.ci_upper, 4)}</td>
                  {!isLinear && <td>{formatNumber(coef.odds_ratio, 4)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">* Rows highlighted indicate statistically significant variables (p &lt; 0.05)</p>
      </div>

      {/* Residuals (Linear only) */}
      {isLinear && results.residuals && (
        <div className="results-section">
          <h3>Residual Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Residual Std Error</div>
              <div className="stat-value">{formatNumber(results.residuals.residual_std_error, 4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Degrees of Freedom</div>
              <div className="stat-value">{results.residuals.degrees_of_freedom}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Min Residual</div>
              <div className="stat-value">{formatNumber(results.residuals.min, 4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Max Residual</div>
              <div className="stat-value">{formatNumber(results.residuals.max, 4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mean Residual</div>
              <div className="stat-value">{formatNumber(results.residuals.mean, 4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Classification Metrics (Logistic only) */}
      {!isLinear && results.classification_metrics && (
        <div className="results-section">
          <h3>Classification Metrics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Accuracy</div>
              <div className="stat-value">{formatNumber(results.classification_metrics.accuracy, 4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sensitivity</div>
              <div className="stat-value">{formatNumber(results.classification_metrics.sensitivity, 4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Specificity</div>
              <div className="stat-value">{formatNumber(results.classification_metrics.specificity, 4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">AUC</div>
              <div className="stat-value">{formatNumber(results.classification_metrics.auc, 4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {results.assumptions && (
        <div className="results-section">
          <h3>Assumption Checks</h3>
          <div className="assumptions-checks">
            {results.assumptions.multicollinearity && (
              <div className="assumption-item">
                <div className={`assumption-result ${results.assumptions.multicollinearity.passed ? 'passed' : 'failed'}`}>
                  {results.assumptions.multicollinearity.passed ? '✓' : '✗'}
                </div>
                <div className="assumption-content">
                  <div className="assumption-name">Multicollinearity (VIF)</div>
                  <div className="assumption-details">
                    {Object.entries(results.assumptions.multicollinearity.details || {}).map(([var_name, vif]) => (
                      <span key={var_name} className="vif-detail">
                        {var_name}: {formatNumber(vif, 2)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {results.assumptions.normality && (
              <div className="assumption-item">
                <div className={`assumption-result ${results.assumptions.normality.passed ? 'passed' : 'failed'}`}>
                  {results.assumptions.normality.passed ? '✓' : '✗'}
                </div>
                <div className="assumption-content">
                  <div className="assumption-name">Normality of Residuals (Shapiro-Wilk)</div>
                  <div className="assumption-details">
                    p-value: {formatNumber(results.assumptions.normality.p_value)}
                  </div>
                </div>
              </div>
            )}

            {results.assumptions.homoscedasticity && (
              <div className="assumption-item">
                <div className={`assumption-result ${results.assumptions.homoscedasticity.passed ? 'passed' : 'failed'}`}>
                  {results.assumptions.homoscedasticity.passed ? '✓' : '✗'}
                </div>
                <div className="assumption-content">
                  <div className="assumption-name">Homoscedasticity (Breusch-Pagan)</div>
                  <div className="assumption-details">
                    p-value: {formatNumber(results.assumptions.homoscedasticity.p_value)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interpretation */}
      {results.interpretation && (
        <div className="results-section">
          <h3>Interpretation</h3>
          <p className="interpretation-text">{results.interpretation}</p>
        </div>
      )}
    </div>
  )
}
