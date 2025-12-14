import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Custom Box and Whisker Shape
const BoxWhiskerShape = (props) => {
  const { cx, cy, payload, xAxis, yAxis } = props

  if (!payload || !payload.q1) return null

  const { q1, q2, q3, whiskerLow, whiskerHigh, outliers = [] } = payload

  // Convert data values to pixel coordinates
  const getY = (value) => {
    const scale = yAxis.scale
    return scale(value)
  }

  const boxWidth = 40
  const left = cx - boxWidth / 2
  const right = cx + boxWidth / 2

  const y1 = getY(q1)
  const y2 = getY(q2)
  const y3 = getY(q3)
  const yWhiskerLow = getY(whiskerLow)
  const yWhiskerHigh = getY(whiskerHigh)

  return (
    <g>
      {/* Lower whisker line */}
      <line x1={cx} y1={y1} x2={cx} y2={yWhiskerLow} stroke="#666" strokeWidth={1} />
      <line x1={left + 10} y1={yWhiskerLow} x2={right - 10} y2={yWhiskerLow} stroke="#666" strokeWidth={1} />

      {/* Box (IQR) */}
      <rect
        x={left}
        y={y3}
        width={boxWidth}
        height={y1 - y3}
        fill="#8884d8"
        fillOpacity={0.7}
        stroke="#666"
        strokeWidth={1}
      />

      {/* Median line */}
      <line x1={left} y1={y2} x2={right} y2={y2} stroke="#d32f2f" strokeWidth={2} />

      {/* Upper whisker line */}
      <line x1={cx} y1={y3} x2={cx} y2={yWhiskerHigh} stroke="#666" strokeWidth={1} />
      <line x1={left + 10} y1={yWhiskerHigh} x2={right - 10} y2={yWhiskerHigh} stroke="#666" strokeWidth={1} />

      {/* Outliers */}
      {outliers.map((outlier, idx) => {
        const yOutlier = getY(outlier)
        return (
          <circle
            key={idx}
            cx={cx}
            cy={yOutlier}
            r={3}
            fill="none"
            stroke="#d32f2f"
            strokeWidth={1.5}
          />
        )
      })}
    </g>
  )
}

export function BoxChart({ data, selectedVars, groupVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const numericVar = selectedVars.numeric
  const transformedData = transformBoxPlotData(data, numericVar, groupVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for box plot</div>
  }

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ScatterChart
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
        <XAxis
          type="category"
          dataKey={groupVar ? 'group' : 'label'}
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12 }}
          label={{ value: groupVar || numericVar, position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis
          type="number"
          label={{ value: numericVar, angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const data = payload[0].payload
              return (
                <div className="custom-tooltip">
                  <p><strong>{data.group || data.label}</strong></p>
                  <p style={{ marginTop: '8px' }}>Lower fence: <strong>{data.whiskerLow.toFixed(2)}</strong></p>
                  <p>Q1: <strong>{data.q1.toFixed(2)}</strong></p>
                  <p>Median: <strong>{data.q2.toFixed(2)}</strong></p>
                  <p>Q3: <strong>{data.q3.toFixed(2)}</strong></p>
                  <p>Upper fence: <strong>{data.whiskerHigh.toFixed(2)}</strong></p>
                  {data.outliers && data.outliers.length > 0 && (
                    <p style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                      Outliers: {data.outliers.length}
                    </p>
                  )}
                </div>
              )
            }
            return null
          }}
          cursor={{ fill: 'rgba(0,0,0,0.1)' }}
        />
        <Scatter
          data={transformedData}
          shape={<BoxWhiskerShape />}
        >
          {transformedData.map((entry, index) => (
            <Cell key={`cell-${index}`} />
          ))}
        </Scatter>
      </ScatterChart>
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
      x: 0,
      y: stats.q2, // Use median for positioning
      ...stats,
    }]
  } else {
    // Multiple box plots grouped
    const groups = [...new Set(data.map(row => row[groupVar]).filter(v => v != null))]
    return groups.map((group, idx) => {
      const groupValues = data
        .filter(row => row[groupVar] === group)
        .map(row => parseFloat(row[numericVar]))
        .filter(v => !isNaN(v))

      if (groupValues.length === 0) return null

      const stats = calculateBoxPlotStats(groupValues)
      return {
        group,
        x: idx,
        y: stats.q2, // Use median for positioning
        ...stats,
      }
    }).filter(item => item !== null)
  }
}

function calculateBoxPlotStats(values) {
  const sorted = [...values].sort((a, b) => a - b)

  const q1 = percentile(sorted, 0.25)
  const q2 = percentile(sorted, 0.5) // median
  const q3 = percentile(sorted, 0.75)

  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr

  // Find whisker ends (highest/lowest values within fences)
  const whiskerLow = sorted.find(v => v >= lowerFence) || sorted[0]
  const whiskerHigh = sorted.reverse().find(v => v <= upperFence) || sorted[0]
  sorted.reverse() // restore order

  // Find outliers (values beyond fences)
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence)

  return {
    q1,
    q2,
    q3,
    whiskerLow,
    whiskerHigh,
    outliers,
    iqr,
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
