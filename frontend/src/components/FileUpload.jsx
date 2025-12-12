import { useState } from 'react'
import api from '../services/api'
import './FileUpload.css'

export default function FileUpload({ onFileUploaded }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

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

  return (
    <div className="file-upload">
      <h2>Upload Your Data</h2>
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

      <div className="sample-data-info">
        <h3>Sample Data Available</h3>
        <p>Test the app with these sample datasets:</p>
        <ul>
          <li><strong>small_dataset.csv</strong> - Small health metrics dataset (325 bytes)</li>
          <li><strong>large_dataset.xlsx</strong> - Larger dataset for comprehensive testing (113 KB)</li>
        </ul>
        <p className="hint">
          💡 These files are in the <code>sample_data/</code> folder for testing purposes.
        </p>
      </div>
    </div>
  )
}
