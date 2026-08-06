import { useEffect, useMemo, useState } from 'react'

/**
 * Paginación en memoria para tablas que ya traen la lista completa.
 * @param {unknown[]} rows
 * @param {{ defaultSize?: number, resetKey?: unknown }} [options]
 */
export function usePagedRows(rows, options = {}) {
  const defaultSize = options.defaultSize ?? 25
  const resetKey = options.resetKey
  const list = Array.isArray(rows) ? rows : []
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(defaultSize)

  useEffect(() => {
    setPage(0)
  }, [list.length, resetKey, defaultSize])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(list.length / rowsPerPage) - 1)
    if (page > maxPage) setPage(maxPage)
  }, [list.length, rowsPerPage, page])

  const paged = useMemo(() => {
    const start = page * rowsPerPage
    return list.slice(start, start + rowsPerPage)
  }, [list, page, rowsPerPage])

  function changeRowsPerPage(n) {
    setRowsPerPage(n)
    setPage(0)
  }

  return {
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage: changeRowsPerPage,
    paged,
    count: list.length,
  }
}
