import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getYAxisDomain } from './axisUtils'

export function ScatterChartComponent({ data, selectedVars, colorVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const xVar = selectedVars.x_var
  const yVar = selectedVars.y_var
  const transformedData = transformScatterData(data, xVar, yVar, colorVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for scatter plot</div>
  }

  const colors = colorVar ? [...new Set(data.map(row => row[colorVar]).filter(v => v != null))] : null

  // Calculate axis domains based on data
  const xAxisDomain = getYAxisDomain(transformedData, ['x'])
  const yAxisDomain = getYAxisDomain(transformedData, ['y'])

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ScatterChart
        margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
        <XAxis
          dataKey="x"
          type="number"
          label={{ value: xVar, position: 'insideBottomRight', offset: -10 }}
          tick={{ fontSize: 12 }}
          domain={xAxisDomain}
        />
        <YAxis
          dataKey="y"
          type="number"
          label={{ value: yVar, angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
          domain={yAxisDomain}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value) => value ? value.toFixed(2) : 'N/A'}
        />
        {colors ? (
          <>
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {colors.map((color, idx) => (
              <Scatter
                key={color}
                name={color}
                data={transformedData.filter(d => d.group === color)}
                fill={getColor(idx)}
              />
            ))}
          </>
        ) : (
          <Scatter
            name={`${xVar} vs ${yVar}`}
            data={transformedData}
            fill="#8884d8"
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function transformScatterData(data, xVar, yVar, colorVar) {
  if (!data || data.length === 0 || !xVar || !yVar) return []

  // Filter rows with valid x and y values
  const validData = data.filter(row => {
    const x = parseFloat(row[xVar])
    const y = parseFloat(row[yVar])
    return !isNaN(x) && !isNaN(y)
  })

  if (validData.length === 0) return []

  if (!colorVar) {
    // Simple scatter plot
    return validData.map(row => ({
      x: parseFloat(row[xVar]),
      y: parseFloat(row[yVar]),
    }))
  } else {
    // Colored scatter plot
    return validData.map(row => ({
      x: parseFloat(row[xVar]),
      y: parseFloat(row[yVar]),
      group: row[colorVar],
    }))
  }
}

function getColor(index) {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffa500']
  return colors[index % colors.length]
}
