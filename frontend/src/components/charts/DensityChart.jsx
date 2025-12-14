import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getYAxisDomain } from './axisUtils'

export function DensityChart({ data, selectedVars, groupVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const numericVar = selectedVars.numeric
  const transformedData = transformDensityData(data, numericVar, groupVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for density plot</div>
  }

  const groups = groupVar
    ? [...new Set(data.map(row => row[groupVar]).filter(v => v != null))]
    : null

  // Calculate Y-axis domain based on density values
  const densityKeys = groups
    ? groups.map(g => `density_${g}`)
    : ['density']
  const yAxisDomain = getYAxisDomain(transformedData, densityKeys)

  return (
    <ResponsiveContainer width="100%" height={600}>
      <LineChart
        data={transformedData}
        margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
        <XAxis
          dataKey="x"
          type="number"
          label={{ value: numericVar, position: 'insideBottomRight', offset: -10 }}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={{ value: 'Density', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
          domain={yAxisDomain}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          formatter={(value) => value ? value.toFixed(4) : 'N/A'}
        />
        {groups ? (
          <>
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {groups.map((group, idx) => (
              <Line
                key={`line-${group}`}
                dataKey={`density_${group}`}
                stroke={getColor(idx)}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name={group}
              />
            ))}
          </>
        ) : (
          <Line
            key="line-density"
            dataKey="density"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function transformDensityData(data, numericVar, groupVar) {
  if (!data || data.length === 0 || !numericVar) return []

  // Extract numeric values and filter out NaN
  const values = data
    .map(row => parseFloat(row[numericVar]))
    .filter(v => !isNaN(v))

  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    // All values are the same
    const xPoints = generateXPoints(min, min, 50)
    return xPoints.map(x => ({
      x: parseFloat(x.toFixed(4)),
      density: x === min ? 1 : 0,
    }))
  }

  const xPoints = generateXPoints(min, max, 200)

  if (!groupVar) {
    // Single density plot
    const kde = new KernelDensityEstimator(values)
    return xPoints.map(x => ({
      x: parseFloat(x.toFixed(4)),
      density: kde.evaluate(x),
    }))
  } else {
    // Multiple density plots grouped
    const groups = [...new Set(data.map(row => row[groupVar]).filter(v => v != null))]
    const groupDensities = {}

    groups.forEach(group => {
      const groupValues = data
        .filter(row => row[groupVar] === group)
        .map(row => parseFloat(row[numericVar]))
        .filter(v => !isNaN(v))

      if (groupValues.length > 0) {
        const kde = new KernelDensityEstimator(groupValues)
        groupDensities[group] = xPoints.map(x => kde.evaluate(x))
      }
    })

    return xPoints.map((x, idx) => {
      const point = { x: parseFloat(x.toFixed(4)) }
      groups.forEach(group => {
        if (groupDensities[group]) {
          point[`density_${group}`] = groupDensities[group][idx]
        }
      })
      return point
    })
  }
}

function generateXPoints(min, max, count) {
  const points = []
  const step = (max - min) / (count - 1)
  for (let i = 0; i < count; i++) {
    points.push(min + i * step)
  }
  return points
}

// Kernel Density Estimator using Gaussian kernel
class KernelDensityEstimator {
  constructor(data, bandwidth = null) {
    this.data = data
    this.n = data.length

    // Calculate bandwidth using Silverman's rule of thumb
    if (bandwidth === null) {
      const std = this.calculateStd(data)
      this.bandwidth = 1.06 * std * Math.pow(this.n, -1 / 5)
    } else {
      this.bandwidth = bandwidth
    }
  }

  evaluate(x) {
    let sum = 0
    for (let i = 0; i < this.n; i++) {
      sum += this.gaussianKernel((x - this.data[i]) / this.bandwidth)
    }
    return sum / (this.n * this.bandwidth)
  }

  gaussianKernel(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  }

  calculateStd(data) {
    const mean = data.reduce((a, b) => a + b) / data.length
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    return Math.sqrt(variance)
  }
}

function getColor(index) {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffa500']
  return colors[index % colors.length]
}
