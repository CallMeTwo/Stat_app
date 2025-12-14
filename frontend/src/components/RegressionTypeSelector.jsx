import { useRef, useEffect } from 'react'

export default function RegressionTypeSelector({
  selectedRegression,
  onSelect,
  regressionConfigs
}) {
  const containerRef = useRef(null)
  const selectedRef = useRef(null)

  // Scroll selected button into view when it changes
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedRegression])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const buttons = containerRef.current?.querySelectorAll('button')
    if (!buttons) return

    const currentIndex = Array.from(buttons).findIndex(btn => btn.dataset.type === selectedRegression)
    let nextIndex = currentIndex

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % buttons.length
        e.preventDefault()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
        e.preventDefault()
        break
      default:
        return
    }

    const nextButton = buttons[nextIndex]
    nextButton?.focus()
    onSelect(nextButton.dataset.type)
  }

  return (
    <div className="regression-type-selector">
      <div className="selector-header">
        <h3>Select Regression Type</h3>
        <p className="selector-description">Choose the type of regression analysis for your data</p>
      </div>

      <div className="regression-buttons" ref={containerRef} onKeyDown={handleKeyDown}>
        {Object.entries(regressionConfigs).map(([key, config]) => (
          <button
            key={key}
            ref={selectedRegression === key ? selectedRef : null}
            data-type={key}
            className={`regression-button ${selectedRegression === key ? 'selected' : ''}`}
            onClick={() => onSelect(key)}
          >
            <div className="button-icon">{config.icon}</div>
            <div className="button-content">
              <h4>{config.name}</h4>
              <p>{config.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
