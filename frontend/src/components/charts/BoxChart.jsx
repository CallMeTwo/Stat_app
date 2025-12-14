import { ComposedChart, Bar, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
      stroke="#000"
      strokeWidth={2}
    />
  )
}

// Custom shape for median line (black)
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
      stroke="#000"
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
      stroke="#000"
      strokeWidth={1}
    />
  )
}


// Color palette for different groups
function getBoxColor(index) {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffa500']
  return colors[index % colors.length]
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


  // Calculate Y-axis domain: min - range/10 to max + range/10
  const allValues = []
  transformedData.forEach(item => {
    allValues.push(item.whiskerLow, item.q1, item.q2, item.q3, item.whiskerHigh)
    if (item.outliers && item.outliers.length > 0) {
      allValues.push(...item.outliers)
    }
  })
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const range = maxValue - minValue
  const yAxisDomain = [minValue - range / 10, maxValue + range / 10]

  // Responsive height: 400px on mobile, 600px on desktop
  const chartHeight = typeof window !== 'undefined' && window.innerWidth < 768 ? 400 : 600

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
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
          allowDataOverflow={true}
          domain={yAxisDomain}
          tickFormatter={(value) => Math.round(value * 100) / 100}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload
              return (
                <div className="custom-tooltip">
                  <p><strong>{data.group || data.label}</strong></p>
                  <p style={{ marginTop: '8px' }}>Upper fence: <strong>{data.whiskerHigh?.toFixed(2)}</strong></p>
                  <p>Q3: <strong>{data.q3?.toFixed(2)}</strong></p>
                  <p>Median: <strong>{data.q2?.toFixed(2)}</strong></p>
                  <p>Q1: <strong>{data.q1?.toFixed(2)}</strong></p>
                  <p>Lower fence: <strong>{data.whiskerLow?.toFixed(2)}</strong></p>
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
        <Bar stackId="a" dataKey="min" fill="none" maxBarSize={40} />
        {/* Lower whisker cap */}
        <Bar stackId="a" dataKey="whiskerLowCap" shape={<HorizonBar />} maxBarSize={40} />
        {/* Lower whisker line */}
        <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} maxBarSize={40} />
        {/* Bottom box (Q1 to Median) - colored by group index */}
        <Bar
          stackId="a"
          dataKey="bottomBox"
          maxBarSize={40}
          stroke="#000"
          strokeWidth={1}
        >
          {transformedData.map((item, idx) => (
            <Cell key={`bottomBox-${idx}`} fill={getBoxColor(idx)} />
          ))}
        </Bar>
        {/* Median line */}
        <Bar stackId="a" dataKey="medianLine" shape={<MedianBar />} maxBarSize={40} />
        {/* Top box (Median to Q3) - colored by group index */}
        <Bar
          stackId="a"
          dataKey="topBox"
          maxBarSize={40}
          stroke="#000"
          strokeWidth={1}
        >
          {transformedData.map((item, idx) => (
            <Cell key={`topBox-${idx}`} fill={getBoxColor(idx)} />
          ))}
        </Bar>
        {/* Upper whisker line */}
        <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} maxBarSize={40} />
        {/* Upper whisker cap */}
        <Bar stackId="a" dataKey="whiskerHighCap" shape={<HorizonBar />} maxBarSize={40} />
        {/* Outliers as scatter points */}
        {outlierData.length > 0 && (
          <Scatter
            data={outlierData}
            dataKey="value"
            fill="none"
            stroke="#d32f2f"
            strokeWidth={1}
            r={2.5}
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
        groupIndex: idx,
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
    const xValue = groupVar ? item.group : item.label

    if (item.outliers && item.outliers.length > 0) {
      // Add outlier points for this group
      item.outliers.forEach(outlierValue => {
        scatterData.push({
          [xKey]: xValue,
          value: outlierValue
        })
      })
    } else {
      // For groups without outliers, add a dummy entry with null value to maintain group presence
      scatterData.push({
        [xKey]: xValue,
        value: null
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
