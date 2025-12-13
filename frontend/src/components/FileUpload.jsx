import { useState, useEffect } from 'react'
import api from '../services/api'
import './FileUpload.css'

export default function FileUpload({ onFileUploaded }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sampleFiles, setSampleFiles] = useState([])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = async (file) => {
    setError(null)
    setIsLoading(true)

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    if (!validTypes.includes(file.type)) {
      setError('Please upload a CSV or Excel file')
      setIsLoading(false)
      return
    }

    // Validate file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/api/upload', formData)
      onFileUploaded(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadSample = async (filename) => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await api.post(`/api/load-sample/${filename}`)
      onFileUploaded(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sample data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Fetch available sample files
    const fetchSampleFiles = async () => {
      try {
        const response = await api.get('/api/sample-data')
        setSampleFiles(response.data.samples || [])
      } catch (err) {
        console.error('Failed to fetch sample files:', err)
      }
    }

    fetchSampleFiles()
  }, [])

  return (
    <div className="file-upload">
      <h2>Upload Your Data</h2>

      <div className="upload-layout">
        <div className="upload-section">
          <p className="description">
            Upload a CSV or Excel file to get started with statistical analysis
          </p>

          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-content">
              <p className="upload-icon">📁</p>
              <p className="upload-text">
                {isLoading ? 'Uploading...' : 'Drag and drop your file here, or click to select'}
              </p>
              <input
                type="file"
                id="file-input"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="upload-button">
                {isLoading ? 'Uploading...' : 'Select File'}
              </label>
            </div>
          </div>

          {error && <div className="error">{error}</div>}
        </div>

        {sampleFiles.length > 0 && (
          <div className="sample-data-section">
            <h3>Or Try Sample Data</h3>
            <p>Don't have data? Test the app with these sample datasets:</p>
            <div className="sample-cards">
              {sampleFiles.map((sample) => (
                <div key={sample.filename} className="sample-card">
                  <div className="sample-icon">
                    {sample.type === 'CSV' ? '📄' : '📊'}
                  </div>
                  <div className="sample-info">
                    <h4>{sample.filename}</h4>
                    <p className="sample-meta">
                      {sample.type} • {(sample.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    className="load-sample-btn"
                    onClick={() => handleLoadSample(sample.filename)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
