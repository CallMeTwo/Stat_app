import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import DataDisplay from './components/DataDisplay'
import AnalysisPanel from './components/AnalysisPanel'

function App() {
  const [currentPage, setCurrentPage] = useState('upload')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)

  const handleFileUploaded = (fileData) => {
    setUploadedFile(fileData)
    setCurrentPage('data')
  }

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results)
    setCurrentPage('results')
  }

  const resetApp = () => {
    setCurrentPage('upload')
    setUploadedFile(null)
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
        <button className="reset" onClick={resetApp}>
          New Upload
        </button>
      </nav>

      <main className="main-content">
        {currentPage === 'upload' && <FileUpload onFileUploaded={handleFileUploaded} />}
        {currentPage === 'data' && uploadedFile && <DataDisplay data={uploadedFile} />}
        {currentPage === 'analysis' && uploadedFile && (
          <AnalysisPanel fileId={uploadedFile.file_id} onAnalysisComplete={handleAnalysisComplete} />
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
