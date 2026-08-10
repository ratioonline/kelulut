export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) {
    return
  }

  const separator = ','
  const keys = Object.keys(rows[0])

  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k as keyof typeof row] === null || row[k as keyof typeof row] === undefined ? '' : row[k as keyof typeof row]
            
            // Format cells that contain comma, newline or double quotes
            if (typeof cell === 'string') {
              cell = cell.replace(/"/g, '""')
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`
              }
            }
            return cell
          })
          .join(separator)
      })
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  if ((navigator as any).msSaveBlob) { // IE 10+
    (navigator as any).msSaveBlob(blob, filename)
  } else {
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
