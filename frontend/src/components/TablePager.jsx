import TablePagination from '@mui/material/TablePagination'

export default function TablePager({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}) {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={(_, p) => onPageChange(p)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
      rowsPerPageOptions={rowsPerPageOptions}
      labelRowsPerPage="Filas"
      labelDisplayedRows={({ from, to, count: total }) =>
        total === 0 ? '0 de 0' : `${from}–${to} de ${total}`
      }
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        '.MuiTablePagination-toolbar': { flexWrap: 'wrap', minHeight: 48 },
      }}
    />
  )
}
