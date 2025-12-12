import './DataDisplay.css'

export default function DataDisplay({ data }) {
  if (!data || !data.preview) {
    return <div className="data-display">No data available</div>
  }

  return (
    <div className="data-display">
      <h2>Data Preview</h2>
      <div className="data-info">
        <p><strong>File:</strong> {data.filename}</p>
        <p><strong>Rows:</strong> {data.rows}</p>
        <p><strong>Columns:</strong> {data.columns?.length || 0}</p>
      </div>

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
            {data.preview?.map((row, rowIdx) => (
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
  )
}
