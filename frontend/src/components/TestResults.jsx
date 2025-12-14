export default function TestResults({ results, testConfig }) {
  const formatValue = (value, decimals = 4) => {
    if (value === null || value === undefined) return 'N/A'
    const num = parseFloat(value)
    if (isNaN(num)) return String(value)

    // Use scientific notation for very small p-values
    if (decimals === 4 && Math.abs(num) < 0.0001 && num !== 0) {
      return num.toExponential(3)
    }
    return num.toFixed(decimals)
  }

  const getPValueInterpretation = (pValue) => {
    if (pValue < 0.001) return '✓ Highly significant (p < 0.001)'
    if (pValue < 0.01) return '✓ Very significant (p < 0.01)'
    if (pValue < 0.05) return '✓ Significant (p < 0.05)'
    return '✗ Not significant (p ≥ 0.05)'
  }

  const renderStatistics = () => {
    const stats = results.statistics
    if (!stats) return null

    return (
      <div className="statistics-section">
        <h4>Test Statistics</h4>
        <table className="results-table">
          <tbody>
            {/* t-test or paired t-test */}
            {(stats.t_statistic !== undefined) && (
              <>
                <tr>
                  <td>t-statistic</td>
                  <td className="value">{formatValue(stats.t_statistic, 3)}</td>
                </tr>
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
                {stats.df !== undefined && (
                  <tr>
                    <td>Degrees of Freedom</td>
                    <td className="value">{stats.df}</td>
                  </tr>
                )}
                {stats.mean_diff !== undefined && (
                  <tr>
                    <td>Mean Difference</td>
                    <td className="value">{formatValue(stats.mean_diff, 3)} [{formatValue(stats.ci_lower, 3)}, {formatValue(stats.ci_upper, 3)}]</td>
                  </tr>
                )}
              </>
            )}

            {/* ANOVA */}
            {(stats.f_statistic !== undefined) && (
              <>
                <tr>
                  <td>F-statistic</td>
                  <td className="value">{formatValue(stats.f_statistic, 3)}</td>
                </tr>
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
                <tr>
                  <td>df (between)</td>
                  <td className="value">{stats.df_between}</td>
                </tr>
                <tr>
                  <td>df (within)</td>
                  <td className="value">{stats.df_within}</td>
                </tr>
                {stats.ss_between !== undefined && (
                  <tr>
                    <td>Sum of Squares (between)</td>
                    <td className="value">{formatValue(stats.ss_between, 3)}</td>
                  </tr>
                )}
                {stats.ss_within !== undefined && (
                  <tr>
                    <td>Sum of Squares (within)</td>
                    <td className="value">{formatValue(stats.ss_within, 3)}</td>
                  </tr>
                )}
              </>
            )}

            {/* Mann-Whitney U */}
            {(stats.u_statistic !== undefined) && (
              <>
                <tr>
                  <td>U-statistic</td>
                  <td className="value">{formatValue(stats.u_statistic, 3)}</td>
                </tr>
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
                {stats.effect_size_r !== undefined && (
                  <tr>
                    <td>Effect Size (r)</td>
                    <td className="value">{formatValue(stats.effect_size_r, 3)}</td>
                  </tr>
                )}
              </>
            )}

            {/* Wilcoxon Signed-Rank */}
            {(stats.w_statistic !== undefined) && (
              <>
                <tr>
                  <td>W-statistic</td>
                  <td className="value">{formatValue(stats.w_statistic, 3)}</td>
                </tr>
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
                {stats.effect_size_r !== undefined && (
                  <tr>
                    <td>Effect Size (r)</td>
                    <td className="value">{formatValue(stats.effect_size_r, 3)}</td>
                  </tr>
                )}
              </>
            )}

            {/* Kruskal-Wallis */}
            {(stats.h_statistic !== undefined) && (
              <>
                <tr>
                  <td>H-statistic</td>
                  <td className="value">{formatValue(stats.h_statistic, 3)}</td>
                </tr>
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
                <tr>
                  <td>Degrees of Freedom</td>
                  <td className="value">{stats.df}</td>
                </tr>
              </>
            )}

            {/* Chi-Square */}
            {(stats.chi_square !== undefined) && (
              <>
                <tr>
                  <td>Chi-Square (χ²)</td>
                  <td className="value">{formatValue(stats.chi_square, 3)}</td>
                </tr>
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
                <tr>
                  <td>Degrees of Freedom</td>
                  <td className="value">{stats.df}</td>
                </tr>
              </>
            )}

            {/* Correlations */}
            {(stats.correlation !== undefined || stats.tau !== undefined) && (
              <>
                {stats.correlation !== undefined && (
                  <>
                    <tr>
                      <td>Correlation Coefficient</td>
                      <td className="value">{formatValue(stats.correlation, 4)}</td>
                    </tr>
                    {stats.ci_lower !== undefined && stats.ci_upper !== undefined && (
                      <tr>
                        <td>95% Confidence Interval</td>
                        <td className="value">[{formatValue(stats.ci_lower, 4)}, {formatValue(stats.ci_upper, 4)}]</td>
                      </tr>
                    )}
                  </>
                )}
                {stats.tau !== undefined && (
                  <tr>
                    <td>Kendall's Tau</td>
                    <td className="value">{formatValue(stats.tau, 4)}</td>
                  </tr>
                )}
                <tr>
                  <td>p-value</td>
                  <td className="value">{formatValue(stats.p_value, 4)} {getPValueInterpretation(stats.p_value).includes('✓') ? '✓' : '✗'}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  const renderGroups = () => {
    const groups = results.groups || results.pairs
    if (!groups) return null

    const groupEntries = Object.entries(groups)

    return (
      <div className="groups-section">
        <h4>Group/Variable Statistics</h4>
        <div className="groups-table">
          {groupEntries.map(([groupName, groupData]) => (
            <div key={groupName} className="group-card">
              <h5>{groupName}</h5>
              <table className="group-stats-table">
                <tbody>
                  {groupData.n !== undefined && <tr><td>N</td><td>{groupData.n}</td></tr>}
                  {groupData.mean !== undefined && <tr><td>Mean</td><td>{formatValue(groupData.mean, 3)}</td></tr>}
                  {groupData.median !== undefined && <tr><td>Median</td><td>{formatValue(groupData.median, 3)}</td></tr>}
                  {groupData.std !== undefined && <tr><td>Std Dev</td><td>{formatValue(groupData.std, 3)}</td></tr>}
                  {groupData.ci_mean_lower !== undefined && groupData.ci_mean_upper !== undefined && (
                    <tr><td>95% CI of Mean</td><td>[{formatValue(groupData.ci_mean_lower, 3)}, {formatValue(groupData.ci_mean_upper, 3)}]</td></tr>
                  )}
                  {groupData.mean_rank !== undefined && <tr><td>Mean Rank</td><td>{formatValue(groupData.mean_rank, 2)}</td></tr>}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderAssumptions = () => {
    const assumptions = results.assumptions
    if (!assumptions) return null

    const assumptionEntries = Object.entries(assumptions)

    return (
      <div className="assumptions-section">
        <h4>Assumptions Check</h4>
        <div className="assumptions-table">
          {assumptionEntries.map(([assumptionName, assumptionData]) => (
            <div key={assumptionName} className={`assumption-row ${assumptionData.passed ? 'passed' : 'failed'}`}>
              <span className="assumption-icon">{assumptionData.passed ? '✓' : '✗'}</span>
              <span className="assumption-name">
                {assumptionName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                {assumptionData.method && ` (${assumptionData.method})`}
              </span>
              <span className="assumption-pvalue">p = {formatValue(assumptionData.p_value, 4)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="test-results">
      <h3>Test Results: {results.test_name}</h3>

      {renderStatistics()}
      {renderGroups()}
      {renderAssumptions()}

      {results.interpretation && (
        <div className="interpretation-section">
          <p className="interpretation">{results.interpretation}</p>
        </div>
      )}
    </div>
  )
}
