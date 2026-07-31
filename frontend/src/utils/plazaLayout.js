export const GRID_CELL = 50
export const GRID_PAD = 20
export const GRID_COLS = 12
export const GRID_ROWS = 8
export const PLAZA_INSET = 5
export const PLAZA_FONT = 8
export const PLAZA_LABEL_Y = 14

export function positionPlazas(plazas) {
  return plazas.map((plaza, index) => {
    const col = plaza.posX ?? index % 5
    const row = plaza.posY ?? Math.floor(index / 5)
    return {
      ...plaza,
      x: GRID_PAD + col * GRID_CELL,
      y: GRID_PAD + row * GRID_CELL,
    }
  })
}

export function stageSizeFromPlazas(plazas, minCols = GRID_COLS, minRows = GRID_ROWS) {
  let maxCol = minCols - 1
  let maxRow = minRows - 1

  plazas.forEach((p) => {
    if (p.posX != null) maxCol = Math.max(maxCol, p.posX)
    if (p.posY != null) maxRow = Math.max(maxRow, p.posY)
  })

  return {
    width: GRID_PAD * 2 + (maxCol + 1) * GRID_CELL,
    height: GRID_PAD * 2 + (maxRow + 1) * GRID_CELL,
  }
}

export function editorStageSize() {
  return {
    width: GRID_PAD * 2 + GRID_COLS * GRID_CELL,
    height: GRID_PAD * 2 + GRID_ROWS * GRID_CELL,
  }
}

export function snapToGrid(x, y) {
  const col = Math.round((x - GRID_PAD) / GRID_CELL)
  const row = Math.round((y - GRID_PAD) / GRID_CELL)
  return {
    col: Math.max(0, Math.min(GRID_COLS - 1, col)),
    row: Math.max(0, Math.min(GRID_ROWS - 1, row)),
    x: GRID_PAD + Math.max(0, Math.min(GRID_COLS - 1, col)) * GRID_CELL,
    y: GRID_PAD + Math.max(0, Math.min(GRID_ROWS - 1, row)) * GRID_CELL,
  }
}

/** Celda bajo el puntero (para selección por arrastre). */
export function cellFromPointer(x, y) {
  const col = Math.floor((x - GRID_PAD) / GRID_CELL)
  const row = Math.floor((y - GRID_PAD) / GRID_CELL)
  return {
    col: Math.max(0, Math.min(GRID_COLS - 1, col)),
    row: Math.max(0, Math.min(GRID_ROWS - 1, row)),
  }
}

/** Todas las celdas dentro de un rectángulo (inclusive). */
export function cellsInRect(a, b) {
  const colMin = Math.min(a.col, b.col)
  const colMax = Math.max(a.col, b.col)
  const rowMin = Math.min(a.row, b.row)
  const rowMax = Math.max(a.row, b.row)
  const cells = []
  for (let row = rowMin; row <= rowMax; row++) {
    for (let col = colMin; col <= colMax; col++) {
      cells.push({ col, row })
    }
  }
  return cells
}

/** Genera códigos P-01, P-02… continuando desde los existentes. */
export function nextPlazaCodigos(plazas, count) {
  const maxNum = plazas.reduce((max, p) => {
    const match = p.codigo?.match(/(\d+)\s*$/)
    return match ? Math.max(max, parseInt(match[1], 10)) : max
  }, 0)

  return Array.from({ length: count }, (_, i) => {
    const n = maxNum + i + 1
    return `P-${String(n).padStart(2, '0')}`
  })
}

export function cellKey(col, row) {
  return `${col},${row}`
}

/** Lista de pisos (1..max) según las plazas cargadas. */
export function derivePisos(plazas) {
  const set = new Set(plazas.map((p) => p.piso || 1))
  const maxPiso = plazas.reduce((max, p) => Math.max(max, p.piso || 1), 1)
  for (let i = 1; i <= maxPiso; i++) set.add(i)
  if (set.size === 0) set.add(1)
  return [...set].sort((a, b) => a - b)
}

export function stageSizeFromCeldas(celdas, minCols = GRID_COLS, minRows = GRID_ROWS) {
  let maxCol = minCols - 1
  let maxRow = minRows - 1

  celdas.forEach((c) => {
    if (c.col != null) maxCol = Math.max(maxCol, c.col)
    if (c.row != null) maxRow = Math.max(maxRow, c.row)
  })

  return {
    width: GRID_PAD * 2 + (maxCol + 1) * GRID_CELL,
    height: GRID_PAD * 2 + (maxRow + 1) * GRID_CELL,
  }
}

export function combinedStageSize(plazas, celdas) {
  const base = editorStageSize()
  const a = plazas.length ? stageSizeFromPlazas(plazas) : base
  const b = celdas?.length ? stageSizeFromCeldas(celdas) : base
  return {
    width: Math.max(a.width, b.width),
    height: Math.max(a.height, b.height),
  }
}

export { GRID_CELL as PLAZA_SIZE }
