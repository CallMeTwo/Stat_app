/**
 * Calculate axis domain with 10% padding
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {[number, number]} - [adjustedMin, adjustedMax]
 */
export function calculateAxisDomain(min, max) {
  if (min === max) {
    // If all values are the same, add 10% padding
    const padding = Math.abs(min) * 0.1 || 1
    return [min - padding, max + padding]
  }

  const range = max - min
  const padding = range * 0.1

  return [min - padding, max + padding]
}

/**
 * Get Y-axis domain from data array
 * @param {Array} data - Array of objects with numeric values
 * @param {string|Array<string>} dataKeys - Single key or array of keys to check
 * @returns {[number, number]} - [min, max] domain
 */
export function getYAxisDomain(data, dataKeys) {
  if (!data || data.length === 0) return [0, 1]

  const keys = Array.isArray(dataKeys) ? dataKeys : [dataKeys]
  let min = Infinity
  let max = -Infinity

  data.forEach(item => {
    keys.forEach(key => {
      const value = item[key]
      if (typeof value === 'number' && !isNaN(value)) {
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    })
  })

  if (min === Infinity || max === -Infinity) {
    return [0, 1]
  }

  return calculateAxisDomain(min, max)
}

/**
 * Get axis domain from numeric values
 * @param {Array<number>} values - Array of numeric values
 * @returns {[number, number]} - [min, max] domain
 */
export function getAxisDomainFromValues(values) {
  if (!values || values.length === 0) return [0, 1]

  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v))
  if (numbers.length === 0) return [0, 1]

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)

  return calculateAxisDomain(min, max)
}
