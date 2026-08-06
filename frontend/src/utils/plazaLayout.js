export const GRID_PAD = 20
/** Tamaño de celda por defecto (px). En grillas grandes se reduce solo. */
export const GRID_CELL = 50
export const GRID_COLS = 12
export const GRID_ROWS = 8

export const GRID_STORAGE_KEY = 'mapa-grid-size'

export const GRID_PRESETS = [
  { id: 'chico', label: '12×8', hint: 'Chico', cols: 12, rows: 8 },
  { id: 'medio', label: '20×12', hint: 'Medio', cols: 20, rows: 12 },
  { id: 'grande', label: '30×20', hint: 'Grande', cols: 30, rows: 20 },
  { id: 'xl', label: '50×20', hint: 'XL', cols: 50, rows: 20 },
]

export const GRID_MIN = 4
export const GRID_MAX_COLS = 80
export const GRID_MAX_ROWS = 50

export function clampGridSize(cols, rows) {
  return {
    cols: Math.min(GRID_MAX_COLS, Math.max(GRID_MIN, Math.round(Number(cols) || GRID_COLS))),
    rows: Math.min(GRID_MAX_ROWS, Math.max(GRID_MIN, Math.round(Number(rows) || GRID_ROWS))),
  }
}

/** Celda más chica si la grilla es grande, para que el canvas no se vaya de mambo. */
export function cellSizeForGrid(cols, rows) {
  const maxW = 1400
  const maxH = 820
  const byW = Math.floor(maxW / Math.max(1, cols))
  const byH = Math.floor(maxH / Math.max(1, rows))
  return Math.max(14, Math.min(GRID_CELL, byW, byH))
}

export function makeGrid(cols = GRID_COLS, rows = GRID_ROWS) {
  const size = clampGridSize(cols, rows)
  const cell = cellSizeForGrid(size.cols, size.rows)
  return { cols: size.cols, rows: size.rows, cell, pad: GRID_PAD }
}

export function loadSavedGrid() {
  try {
    const raw = localStorage.getItem(GRID_STORAGE_KEY)
    if (!raw) return makeGrid()
    const parsed = JSON.parse(raw)
    return makeGrid(parsed.cols, parsed.rows)
  } catch {
    return makeGrid()
  }
}

export function saveGrid(cols, rows) {
  const size = clampGridSize(cols, rows)
  localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(size))
  return makeGrid(size.cols, size.rows)
}

export function matchPreset(cols, rows) {
  return GRID_PRESETS.find((p) => p.cols === cols && p.rows === rows) || null
}

export function plazaMetrics(cell = GRID_CELL) {
  return {
    size: cell,
    inset: Math.max(2, Math.round(cell * 0.1)),
    font: Math.max(7, Math.round(cell * 0.22)),
    labelY: Math.max(8, Math.round(cell * 0.28)),
  }
}

/** Extensión mínima (cols/rows) para cubrir plazas y celdas existentes. */
export function contentExtent(plazas = [], celdas = []) {
  let maxCol = -1
  let maxRow = -1
  for (const p of plazas) {
    if (p.posX != null) maxCol = Math.max(maxCol, p.posX)
    if (p.posY != null) maxRow = Math.max(maxRow, p.posY)
  }
  for (const c of celdas) {
    if (c.col != null) maxCol = Math.max(maxCol, c.col)
    if (c.row != null) maxRow = Math.max(maxRow, c.row)
  }
  return {
    cols: Math.max(GRID_MIN, maxCol + 1),
    rows: Math.max(GRID_MIN, maxRow + 1),
  }
}

/** Asegura que la grilla no quede más chica que el contenido. */
export function gridFittingContent(cols, rows, plazas = [], celdas = []) {
  const extent = contentExtent(plazas, celdas)
  const fitted = {
    cols: Math.max(cols, extent.cols),
    rows: Math.max(rows, extent.rows),
  }
  return {
    grid: makeGrid(fitted.cols, fitted.rows),
    expanded: fitted.cols > cols || fitted.rows > rows,
    extent,
  }
}

export function editorStageSize(grid = makeGrid()) {
  return {
    width: grid.pad * 2 + grid.cols * grid.cell,
    height: grid.pad * 2 + grid.rows * grid.cell,
  }
}

export function positionPlazas(plazas, grid = makeGrid()) {
  return plazas.map((plaza, index) => {
    const col = plaza.posX ?? index % 5
    const row = plaza.posY ?? Math.floor(index / 5)
    return {
      ...plaza,
      x: grid.pad + col * grid.cell,
      y: grid.pad + row * grid.cell,
    }
  })
}

export function stageSizeFromPlazas(plazas, grid = makeGrid()) {
  let maxCol = grid.cols - 1
  let maxRow = grid.rows - 1

  plazas.forEach((p) => {
    if (p.posX != null) maxCol = Math.max(maxCol, p.posX)
    if (p.posY != null) maxRow = Math.max(maxRow, p.posY)
  })

  return {
    width: grid.pad * 2 + (maxCol + 1) * grid.cell,
    height: grid.pad * 2 + (maxRow + 1) * grid.cell,
  }
}

export function snapToGrid(x, y, grid = makeGrid()) {
  const col = Math.round((x - grid.pad) / grid.cell)
  const row = Math.round((y - grid.pad) / grid.cell)
  const c = Math.max(0, Math.min(grid.cols - 1, col))
  const r = Math.max(0, Math.min(grid.rows - 1, row))
  return {
    col: c,
    row: r,
    x: grid.pad + c * grid.cell,
    y: grid.pad + r * grid.cell,
  }
}

/** Celda bajo el puntero (para selección por arrastre). */
export function cellFromPointer(x, y, grid = makeGrid()) {
  const col = Math.floor((x - grid.pad) / grid.cell)
  const row = Math.floor((y - grid.pad) / grid.cell)
  return {
    col: Math.max(0, Math.min(grid.cols - 1, col)),
    row: Math.max(0, Math.min(grid.rows - 1, row)),
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

/** Letra del piso: 1→A, 2→B, 3→C… */
export function letraPiso(piso) {
  const n = Math.max(1, Number(piso) || 1)
  if (n <= 26) return String.fromCharCode(64 + n)
  let num = n
  let s = ''
  while (num > 0) {
    num -= 1
    s = String.fromCharCode(65 + (num % 26)) + s
    num = Math.floor(num / 26)
  }
  return s
}

/**
 * Códigos por piso: piso 1 → A1, A2…; piso 2 → B1, B2…; piso 3 → C1…
 */
export function nextPlazaCodigos(plazas, count, piso = 1) {
  const letra = letraPiso(piso)
  const re = new RegExp(`^${letra}(\\d+)$`, 'i')

  const maxNum = (plazas || []).reduce((max, p) => {
    if ((p.piso || 1) !== (piso || 1)) return max
    const match = p.codigo?.match(re)
    return match ? Math.max(max, parseInt(match[1], 10)) : max
  }, 0)

  return Array.from({ length: count }, (_, i) => `${letra}${maxNum + i + 1}`)
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

export function stageSizeFromCeldas(celdas, grid = makeGrid()) {
  let maxCol = grid.cols - 1
  let maxRow = grid.rows - 1

  celdas.forEach((c) => {
    if (c.col != null) maxCol = Math.max(maxCol, c.col)
    if (c.row != null) maxRow = Math.max(maxRow, c.row)
  })

  return {
    width: grid.pad * 2 + (maxCol + 1) * grid.cell,
    height: grid.pad * 2 + (maxRow + 1) * grid.cell,
  }
}

export function combinedStageSize(plazas, celdas, preferred = makeGrid()) {
  const { grid } = gridFittingContent(preferred.cols, preferred.rows, plazas, celdas)
  const base = editorStageSize(grid)
  const a = plazas.length ? stageSizeFromPlazas(plazas, grid) : base
  const b = celdas?.length ? stageSizeFromCeldas(celdas, grid) : base
  return {
    width: Math.max(a.width, b.width, base.width),
    height: Math.max(a.height, b.height, base.height),
    grid,
  }
}

/** @deprecated usar plazaMetrics(grid.cell).size */
export const PLAZA_SIZE = GRID_CELL
export const PLAZA_INSET = 5
export const PLAZA_FONT = 8
export const PLAZA_LABEL_Y = 14
