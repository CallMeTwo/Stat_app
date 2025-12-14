import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts'

export function MeanCIChart({ data, selectedVars, groupVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const numericVar = selectedVars.numeric
  const transformedData = transformMeanCIData(data, numericVar, groupVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for mean ± CI plot</div>
  }

  return (
    <ResponsiveContainer width="100%" height={600}>
      <BarChart
        data={transformedData}
        margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
        <XAxis
          dataKey={groupVar ? 'group' : 'label'}
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12 }}
          label={{ value: groupVar || 'Overall', position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis
          label={{ value: numericVar, angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const data = payload[0].payload
              return (
                <div className="custom-tooltip">
                  <p><strong>Mean ± 95% CI</strong></p>
                  <p style={{ marginTop: '8px' }}>Mean: <strong>{data.mean.toFixed(2)}</strong></p>
                  <p>95% CI: <strong>[{data.ciLow.toFixed(2)}, {data.ciHigh.toFixed(2)}]</strong></p>
                  <p style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                    N = {data.n}
                  </p>
                </div>
              )
            }
            return null
          }}
          cursor={{ fill: 'rgba(0,0,0,0.1)' }}
        />
        <Bar dataKey="mean" fill="#8884d8" name="Mean" radius={[4, 4, 0, 0]}>
          <ErrorBar
            dataKey="ciRange"
            width={4}
            strokeWidth={2}
            stroke="#666"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function transformMeanCIData(data, numericVar, groupVar) {
  if (!data || data.length === 0 || !numericVar) return []

  // Extract numeric values and filter out NaN
  const values = data
    .map(row => parseFloat(row[numericVar]))
    .filter(v => !isNaN(v))

  if (values.length === 0) return []

  if (!groupVar) {
    // Single mean ± CI
    const stats = calculateMeanCI(values)
    return [{
      label: numericVar,
      ...stats,
      ciRange: [stats.mean - stats.ciLow, stats.ciHigh - stats.mean],
    }]
  } else {
    // Multiple means grouped
    const groups = [...new Set(data.map(row => row[groupVar]).filter(v => v != null))]
    return groups.map(group => {
      const groupValues = data
        .filter(row => row[groupVar] === group)
        .map(row => parseFloat(row[numericVar]))
        .filter(v => !isNaN(v))

      if (groupValues.length === 0) return null

      const stats = calculateMeanCI(groupValues)
      return {
        group,
        ...stats,
        ciRange: [stats.mean - stats.ciLow, stats.ciHigh - stats.mean],
      }
    }).filter(item => item !== null)
  }
}

function calculateMeanCI(values) {
  const n = values.length
  if (n === 0) return null

  // Calculate mean
  const mean = values.reduce((a, b) => a + b, 0) / n

  // Calculate standard error
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
  const std = Math.sqrt(variance)
  const se = std / Math.sqrt(n)

  // Calculate 95% CI using t-distribution
  // For simplicity, use z-score approximation (1.96 for large samples)
  // For small samples, this is less accurate but provides reasonable estimate
  const tValue = getTValue(n - 1, 0.05)
  const margin = tValue * se

  return {
    mean,
    ciLow: mean - margin,
    ciHigh: mean + margin,
    n,
    std,
    se,
  }
}

// Simplified t-distribution value for 95% confidence
// Returns approximate critical value for given degrees of freedom
function getTValue(df, alpha) {
  // For simplicity, use approximation based on degrees of freedom
  if (df >= 30) return 1.96 // Normal approximation
  if (df >= 20) return 2.086
  if (df >= 10) return 2.228
  if (df >= 5) return 2.571
  if (df >= 3) return 3.182
  if (df >= 2) return 4.303
  if (df >= 1) return 12.706
  return 1.96
}
