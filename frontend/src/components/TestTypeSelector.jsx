import { useState } from 'react'

export default function TestTypeSelector({ selectedTest, onSelect, testConfigs }) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const tests = Object.entries(testConfigs).map(([key, config]) => ({
    id: key,
    ...config
  }))

  const handleKeyDown = (e, currentIndex) => {
    let nextIndex = currentIndex

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % tests.length
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + tests.length) % tests.length
      e.preventDefault()
    }

    if (nextIndex !== currentIndex) {
      onSelect(tests[nextIndex].id)
      // Focus the newly selected button
      setTimeout(() => {
        const buttons = document.querySelectorAll('.test-type-card')
        buttons[nextIndex]?.focus()
      }, 0)
      setFocusedIndex(nextIndex)
    }
  }

  const currentIndex = tests.findIndex(t => t.id === selectedTest)

  return (
    <div className="test-type-selector">
      <h3>Select Test Type</h3>
      <div className="test-type-grid">
        {tests.map((test, idx) => (
          <button
            key={test.id}
            className={`test-type-card ${selectedTest === test.id ? 'selected' : ''}`}
            onClick={() => onSelect(test.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={() => setFocusedIndex(idx)}
            aria-pressed={selectedTest === test.id}
            title={test.name}
            tabIndex={selectedTest === test.id ? 0 : -1}
          >
            <div className="test-icon">{test.icon}</div>
            <div className="test-name">{test.name}</div>
            <div className="test-description">{test.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
