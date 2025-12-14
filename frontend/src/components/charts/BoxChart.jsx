import { ComposedChart, Bar, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Custom shape for horizontal lines (whisker ends)
const HorizonBar = (props) => {
  const { x, y, width, height } = props
  const lineWidth = width * 0.6
  const cx = x + width / 2
  const cy = y + height / 2

  return (
    <line
      x1={cx - lineWidth / 2}
      y1={cy}
      x2={cx + lineWidth / 2}
      y2={cy}
      stroke="#666"
      strokeWidth={2}
    />
  )
}

// Custom shape for median line (red)
const MedianBar = (props) => {
  const { x, y, width, height } = props
  const cx = x + width / 2
  const cy = y + height / 2

  return (
    <line
      x1={x}
      y1={cy}
      x2={x + width}
      y2={cy}
      stroke="#d32f2f"
      strokeWidth={2.5}
    />
  )
}

// Custom shape for vertical whisker lines
const DotBar = (props) => {
  const { x, y, width, height } = props
  const cx = x + width / 2

  return (
    <line
      x1={cx}
      y1={y}
      x2={cx}
      y2={y + height}
      stroke="#666"
      strokeWidth={1}
    />
  )
}

export function BoxChart({ data, selectedVars, groupVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const numericVar = selectedVars.numeric
  const transformedData = transformBoxPlotData(data, numericVar, groupVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for box plot</div>
  }

  // Prepare outlier data for scatter plot
  const xDataKey = groupVar ? 'group' : 'label'
  const outlierData = prepareOutlierData(transformedData, groupVar)
  
  return (
    <ResponsiveContainer width="100%" height={600}>
      <ComposedChart
        data={transformedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
        <XAxis
          dataKey={xDataKey}
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12 }}
          allowDuplicatedCategory={false}
          label={{ value: groupVar || numericVar, position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis
          label={{ value: numericVar, angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload
              return (
                <div className="custom-tooltip">
                  <p><strong>{data.group || data.label}</strong></p>
                  <p style={{ marginTop: '8px' }}>Lower fence: <strong>{data.whiskerLow?.toFixed(2)}</strong></p>
                  <p>Q1: <strong>{data.q1?.toFixed(2)}</strong></p>
                  <p>Median: <strong>{data.q2?.toFixed(2)}</strong></p>
                  <p>Q3: <strong>{data.q3?.toFixed(2)}</strong></p>
                  <p>Upper fence: <strong>{data.whiskerHigh?.toFixed(2)}</strong></p>
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
        {/* Invisible bar to offset from bottom */}
        <Bar stackId="a" dataKey="min" fill="none" />
        {/* Lower whisker cap */}
        <Bar stackId="a" dataKey="whiskerLowCap" shape={<HorizonBar />} />
        {/* Lower whisker line */}
        <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
        {/* Bottom box (Q1 to Median) */}
        <Bar stackId="a" dataKey="bottomBox" fill="#8884d8" stroke="#666" strokeWidth={1} />
        {/* Median line */}
        <Bar stackId="a" dataKey="medianLine" shape={<MedianBar />} />
        {/* Top box (Median to Q3) */}
        <Bar stackId="a" dataKey="topBox" fill="#8884d8" stroke="#666" strokeWidth={1} />
        {/* Upper whisker line */}
        <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />
        {/* Upper whisker cap */}
        <Bar stackId="a" dataKey="whiskerHighCap" shape={<HorizonBar />} />
        {/* Outliers as scatter points */}
        {outlierData.length > 0 && (
          <Scatter
            data={outlierData}
            dataKey="value"
            fill="red"
            stroke="#d32f2f"
            strokeWidth={0.5}
            shape="circle"
          />
        )}
      </ComposedChart>
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
      ...convertToStackedData(stats),
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
        ...stats,
        ...convertToStackedData(stats),
      }
    }).filter(item => item !== null)
  }
}

// Convert box plot stats to stacked bar data
function convertToStackedData(stats) {
  const { whiskerLow, q1, q2, q3, whiskerHigh } = stats

  return {
    min: whiskerLow, // Start from the lowest whisker
    whiskerLowCap: 0, // Just a line, no height
    bottomWhisker: q1 - whiskerLow, // From whiskerLow to Q1
    bottomBox: q2 - q1, // From Q1 to median
    medianLine: 0, // Just a line, no height
    topBox: q3 - q2, // From median to Q3
    topWhisker: whiskerHigh - q3, // From Q3 to whiskerHigh
    whiskerHighCap: 0, // Just a line, no height
  }
}

// Prepare outlier data for scatter plot
function prepareOutlierData(transformedData, groupVar) {
  const scatterData = []
  const xKey = groupVar ? 'group' : 'label'

  transformedData.forEach((item) => {
    if (item.outliers && item.outliers.length > 0) {
      const xValue = groupVar ? item.group : item.label

      item.outliers.forEach(outlierValue => {
        scatterData.push({
          [xKey]: xValue,
          value: outlierValue
        })
      })
    }
  })

  return scatterData
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
