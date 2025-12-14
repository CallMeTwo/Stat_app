import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts'

export function BoxChart({ data, selectedVars, groupVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const numericVar = selectedVars.numeric
  const transformedData = transformBoxPlotData(data, numericVar, groupVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for box plot</div>
  }

  return (
    <ResponsiveContainer width="100%" height={600}>
      <BarChart data={transformedData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={groupVar ? 'group' : 'label'}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis label={{ value: numericVar, angle: -90, position: 'insideLeft' }} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const data = payload[0].payload
              return (
                <div className="custom-tooltip">
                  <p>{`Q1: ${data.q1.toFixed(2)}`}</p>
                  <p>{`Median: ${data.q2.toFixed(2)}`}</p>
                  <p>{`Q3: ${data.q3.toFixed(2)}`}</p>
                  <p>{`Min: ${data.min.toFixed(2)}`}</p>
                  <p>{`Max: ${data.max.toFixed(2)}`}</p>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="q2" fill="#8884d8" name="Median">
          <ErrorBar
            dataKey="errorRange"
            width={4}
            strokeWidth={2}
            stroke="#666"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function transformBoxPlotData(data, numericVar, groupVar) {
  if (!data || data.length === 0 || !numericVar) return []

  // Extract numeric values and filter out NaN
  const values = data
    .map(row => parseFloat(row[numericVar]))
    .filter(v => !isNaN(v))

  if (values.length === 0) return []

  if (!groupVar) {
    // Single box plot
    const stats = calculateBoxPlotStats(values)
    return [{
      label: numericVar,
      ...stats,
      errorRange: [stats.q1, stats.q3],
    }]
  } else {
    // Multiple box plots grouped
    const groups = [...new Set(data.map(row => row[groupVar]).filter(v => v != null))]
    return groups.map(group => {
      const groupValues = data
        .filter(row => row[groupVar] === group)
        .map(row => parseFloat(row[numericVar]))
        .filter(v => !isNaN(v))

      if (groupValues.length === 0) return null

      const stats = calculateBoxPlotStats(groupValues)
      return {
        group,
        ...stats,
        errorRange: [stats.q1, stats.q3],
      }
    }).filter(item => item !== null)
  }
}

function calculateBoxPlotStats(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  const q1 = percentile(sorted, 0.25)
  const q2 = percentile(sorted, 0.5) // median
  const q3 = percentile(sorted, 0.75)

  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr

  return {
    min: Math.max(min, lowerFence),
    q1,
    q2,
    q3,
    max: Math.min(max, upperFence),
    whiskerMin: lowerFence,
    whiskerMax: upperFence,
  }
}

function percentile(sorted, p) {
  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) return sorted[lower]

  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}
