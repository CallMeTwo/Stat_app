import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function ScatterChartComponent({ data, selectedVars, colorVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const xVar = selectedVars.x_var
  const yVar = selectedVars.y_var
  const transformedData = transformScatterData(data, xVar, yVar, colorVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for scatter plot</div>
  }

  const colors = colorVar ? [...new Set(transformedData.map(d => d.group))] : null

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          label={{ value: xVar, position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis
          dataKey="y"
          type="number"
          label={{ value: yVar, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        {colors ? (
          <>
            <Legend />
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
          <Scatter name={`${xVar} vs ${yVar}`} data={transformedData} fill="#8884d8" />
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
