import * as XLSX from 'xlsx'

/** Descarga un archivo Excel (.xlsx). */
export function downloadExcel(filename, headers, rows, sheetName = 'Datos') {
  const data = [headers, ...rows.map((row) => row.map((v) => (v == null ? '' : v)))]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const colWidths = headers.map((h, i) => {
    let max = String(h).length
    for (const row of rows) {
      const len = String(row[i] ?? '').length
      if (len > max) max = len
    }
    return { wch: Math.min(40, Math.max(10, max + 2)) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, name)
}

/** @deprecated preferí downloadExcel */
export function downloadCsv(filename, headers, rows) {
  downloadExcel(filename.replace(/\.csv$/i, '.xlsx'), headers, rows)
}
