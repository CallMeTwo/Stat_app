import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function HistogramChart({ data, selectedVars, groupVar }) {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>

  const numericVar = selectedVars.numeric
  const transformedData = transformHistogramData(data, numericVar, groupVar)

  if (!transformedData || transformedData.length === 0) {
    return <div className="no-data">No valid data for histogram</div>
  }

  // Get unique groups for dynamic bars
  const groups = groupVar ? [...new Set(transformedData.map(d => d.group))] : null

  return (
    <ResponsiveContainer width="100%" height={600}>
      <BarChart data={transformedData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="bin"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {groups ? (
          <>
            <Legend />
            {groups.map((group, idx) => (
              <Bar
                key={group}
                dataKey={`count_${group}`}
                stackId="group"
                fill={getColor(idx)}
                name={group}
              />
            ))}
          </>
        ) : (
          <Bar dataKey="count" fill="#8884d8" />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function transformHistogramData(data, numericVar, groupVar) {
  if (!data || data.length === 0 || !numericVar) return []

  // Extract numeric values and filter out NaN
  const values = data
    .map(row => parseFloat(row[numericVar]))
    .filter(v => !isNaN(v))

  if (values.length === 0) return []

  // Calculate bin width using Freedman-Diaconis rule
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) {
    // All values are the same
    return [{ bin: `${min.toFixed(2)}`, count: values.length, group: groupVar ? 'All' : undefined }]
  }

  const q1 = percentile(values, 0.25)
  const q3 = percentile(values, 0.75)
  const iqr = q3 - q1
  const binWidth = iqr === 0 ? 1 : Math.max(1, Math.ceil(2 * iqr / Math.pow(values.length, 1 / 3)))

  // Create bins
  const numBins = Math.ceil(range / binWidth)
  const bins = []

  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth
    const binEnd = binStart + binWidth
    bins.push({
      bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      binStart,
      binEnd,
    })
  }

  // Count values in each bin
  if (!groupVar) {
    return bins.map(bin => ({
      ...bin,
      count: values.filter(v => v >= bin.binStart && v < bin.binEnd).length,
    }))
  } else {
    // With grouping
    const groupedData = bins.map(bin => {
      const binObj = {
        bin: bin.bin,
        binStart: bin.binStart,
        binEnd: bin.binEnd,
      }

      const groups = [...new Set(data.map(row => row[groupVar]).filter(v => v != null))]
      groups.forEach(group => {
        const groupValues = data
          .filter(row => row[groupVar] === group)
          .map(row => parseFloat(row[numericVar]))
          .filter(v => !isNaN(v))

        binObj[`count_${group}`] = groupValues.filter(v => v >= bin.binStart && v < bin.binEnd).length
      })

      return binObj
    })

    return groupedData
  }
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) return sorted[lower]

  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function getColor(index) {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffa500']
  return colors[index % colors.length]
}
