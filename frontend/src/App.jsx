import { useState, useEffect } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import DataDisplay from './components/DataDisplay'
import DataTypeValidation from './components/DataTypeValidation'
import DataSummary from './components/DataSummary'
import AnalysisPanel from './components/AnalysisPanel'
import api from './services/api'

function App() {
  const [currentPage, setCurrentPage] = useState('upload')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [variableAnalysis, setVariableAnalysis] = useState(null)
  const [summaryData, setSummaryData] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  const handleFileUploaded = async (fileData) => {
    setUploadedFile(fileData)
    setCurrentPage('data')

    // Fetch variable analysis once after upload
    try {
      const response = await api.post(`/api/analyze-variables/${fileData.file_id}`)
      // Initialize with state management for user modifications
      const variablesWithState = response.data.variables.map(v => ({
        ...v,
        currentType: v.detected_type,
        isModified: false
      }))
      setVariableAnalysis(variablesWithState)

      // Immediately fetch summary statistics for all variables
      try {
        const summaryResponse = await api.post(`/api/summary-statistics/${fileData.file_id}`, {
          variables: variablesWithState
        })
        setSummaryData(summaryResponse.data.summaries)
      } catch (summaryErr) {
        console.error('Failed to fetch summary statistics:', summaryErr)
        // Set empty object so page doesn't break
        setSummaryData({})
      }
    } catch (err) {
      console.error('Failed to analyze variables:', err)
      // Still allow user to proceed even if analysis fails
      setVariableAnalysis([])
      setSummaryData({})
    }
  }

  const handleVariableTypesChanged = async (updatedVariables) => {
    // Find which variables had their type changed
    const changedVariables = updatedVariables.filter((v, idx) => {
      const oldVar = variableAnalysis[idx]
      return oldVar && v.currentType !== oldVar.currentType
    })

    setVariableAnalysis(updatedVariables)

    // Fetch new summaries for variables whose type changed
    if (changedVariables.length > 0 && uploadedFile) {
      for (const variable of changedVariables) {
        try {
          const response = await api.post(
            `/api/summary-statistics/${uploadedFile.file_id}/${variable.name}`,
            { varType: variable.currentType }
          )

          // Update only this variable's summary
          setSummaryData(prev => ({
            ...prev,
            [variable.name]: response.data.summary
          }))
        } catch (err) {
          console.error(`Failed to update summary for ${variable.name}:`, err)
        }
      }
    }
  }

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results)
    setCurrentPage('results')
  }

  const resetApp = () => {
    setCurrentPage('upload')
    setUploadedFile(null)
    setVariableAnalysis(null)
    setSummaryData(null)
    setAnalysisResults(null)
  }

  return (
    <div className="app">
      <nav className="nav">
        <span className="app-title">📊 Stats React</span>
        <button
          className={currentPage === 'upload' ? 'active' : ''}
          onClick={() => setCurrentPage('upload')}
        >
          Upload
        </button>
        {uploadedFile && (
          <>
            <button
              className={currentPage === 'data' ? 'active' : ''}
              onClick={() => setCurrentPage('data')}
            >
              Data Preview
            </button>
            <button
              className={currentPage === 'datatype' ? 'active' : ''}
              onClick={() => setCurrentPage('datatype')}
            >
              Data Types
            </button>
            <button
              className={currentPage === 'summary' ? 'active' : ''}
              onClick={() => setCurrentPage('summary')}
            >
              Data Summary
            </button>
            <button
              className={currentPage === 'analysis' ? 'active' : ''}
              onClick={() => setCurrentPage('analysis')}
            >
              Analysis
            </button>
          </>
        )}
        {analysisResults && (
          <button
            className={currentPage === 'results' ? 'active' : ''}
            onClick={() => setCurrentPage('results')}
          >
            Results
          </button>
        )}
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>

      <main className="main-content">
        {currentPage === 'upload' && <FileUpload onFileUploaded={handleFileUploaded} />}
        {currentPage === 'data' && uploadedFile && (
          <DataDisplay data={uploadedFile} variableAnalysis={variableAnalysis} />
        )}
        {currentPage === 'datatype' && uploadedFile && variableAnalysis && (
          <DataTypeValidation
            variableAnalysis={variableAnalysis}
            onVariableTypesChanged={handleVariableTypesChanged}
          />
        )}
        {currentPage === 'summary' && uploadedFile && variableAnalysis && summaryData && (
          <DataSummary
            variableAnalysis={variableAnalysis}
            summaryData={summaryData}
          />
        )}
        {currentPage === 'analysis' && uploadedFile && (
          <AnalysisPanel
            fileId={uploadedFile.file_id}
            variableAnalysis={variableAnalysis}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
        {currentPage === 'results' && analysisResults && (
          <div className="results-container">
            <h2>Analysis Results</h2>
            <pre>{JSON.stringify(analysisResults, null, 2)}</pre>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 Stats React. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
