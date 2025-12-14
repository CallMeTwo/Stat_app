import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function BarChartComponent({ data, selectedVars, stackVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const categoricalVar = selectedVars.categorical
  const transformedData = transformBarData(data, categoricalVar, stackVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for bar plot</div>
  }

  // Get stack groups from raw data
  const stackGroups = stackVar
    ? [...new Set(data.map(row => row[stackVar]).filter(v => v != null))]
    : null

  return (
    <ResponsiveContainer width="100%" height={600}>
      <BarChart
        data={transformedData}
        margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
        <XAxis
          dataKey="category"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12 }}
          label={{ value: categoricalVar, position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis
          label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          cursor={{ fill: 'rgba(0,0,0,0.1)' }}
        />
        {stackGroups ? (
          <>
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {stackGroups.map((group, idx) => (
              <Bar
                key={`bar-${group}`}
                dataKey={`count_${group}`}
                stackId="stack"
                fill={getColor(idx)}
                name={group}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </>
        ) : (
          <Bar
            key="bar-count"
            dataKey="count"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function transformBarData(data, categoricalVar, stackVar) {
  if (!data || data.length === 0 || !categoricalVar) return []

  // Get unique categories
  const categories = [...new Set(data.map(row => row[categoricalVar]).filter(v => v != null))]

  if (!stackVar) {
    // Simple bar plot: count frequencies per category
    return categories.map(category => ({
      category,
      count: data.filter(row => row[categoricalVar] === category).length,
    }))
  } else {
    // Stacked bar plot
    const stackedData = categories.map(category => {
      const categoryData = data.filter(row => row[categoricalVar] === category)
      const stackGroups = [...new Set(categoryData.map(row => row[stackVar]).filter(v => v != null))]

      const barData = {
        category,
      }

      stackGroups.forEach(stackGroup => {
        const count = categoryData.filter(row => row[stackVar] === stackGroup).length
        barData[`count_${stackGroup}`] = count
      })

      return barData
    })

    return stackedData
  }
}

function getColor(index) {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffa500']
  return colors[index % colors.length]
}
