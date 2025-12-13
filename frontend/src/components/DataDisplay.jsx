import './DataDisplay.css'

export default function DataDisplay({ data }) {
  if (!data || !data.preview) {
    return <div className="data-display">No data available</div>
  }

  // Prepare preview rows: first 5 and last 5
  const previewRows = data.preview || []
  const totalRows = data.rows || previewRows.length
  const showSeparateTables = totalRows > 10

  const firstFiveRows = previewRows.slice(0, 5)
  const lastFiveRows = totalRows > 10 ? previewRows.slice(-5) : []

  return (
    <div className="data-display">
      <h2>Data Preview</h2>
      <div className="data-info">
        <p><strong>File:</strong> {data.filename}</p>
        <p><strong>Rows:</strong> {data.rows}</p>
        <p><strong>Columns:</strong> {data.columns?.length || 0}</p>
      </div>

      {/* Column names list */}
      <div className="columns-list">
        <h3>Column Names:</h3>
        <ol className="column-names">
          {data.columns?.map((col, idx) => (
            <li key={idx}>{col}</li>
          ))}
        </ol>
      </div>

      {showSeparateTables ? (
        <>
          {/* First 5 rows table */}
          <div className="table-section">
            <h3 className="table-title">First 5 Rows</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {data.columns?.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firstFiveRows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx}>
                          {typeof cell === 'number' ? cell.toFixed(2) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Last 5 rows table */}
          <div className="table-section">
            <h3 className="table-title">Last 5 Rows</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {data.columns?.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lastFiveRows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx}>
                          {typeof cell === 'number' ? cell.toFixed(2) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Single table for datasets with 10 or fewer rows */
        <div className="table-section">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {data.columns?.map((col, idx) => (
                    <th key={idx}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, colIdx) => (
                      <td key={colIdx}>
                        {typeof cell === 'number' ? cell.toFixed(2) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
