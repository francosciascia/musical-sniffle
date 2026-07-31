/** Tipos de celda al dibujar la forma del edificio. */
export const TIPO_CELDA = {
  FORMA: 'FORMA',
  OBSTACULO: 'OBSTACULO',
}

export const COLORES_CELDA = {
  FORMA: '#cfd8dc',
  OBSTACULO: '#455a64',
}

export function cellMapFromCeldas(celdas) {
  const map = new Map()
  for (const c of celdas || []) {
    map.set(`${c.col},${c.row}`, c.tipo)
  }
  return map
}

export function celdasFromMap(map) {
  return [...map.entries()].map(([key, tipo]) => {
    const [col, row] = key.split(',').map(Number)
    return { col, row, tipo }
  })
}

export function applyPaint(celdas, cells, herramienta) {
  const map = cellMapFromCeldas(celdas)
  for (const { col, row } of cells) {
    const key = `${col},${row}`
    if (herramienta === 'BORRAR') {
      map.delete(key)
    } else {
      map.set(key, herramienta)
    }
  }
  return celdasFromMap(map)
}

/** Solo se pueden poner plazas si el piso está guardado y (opcional) sobre contorno FORMA. */
export function celdaPermitePlaza(celdas, col, row, pisoGuardado = true) {
  if (!pisoGuardado) return false
  if (!celdas?.length) return true
  const hayContorno = celdas.some((c) => c.tipo === TIPO_CELDA.FORMA)
  if (!hayContorno) return true
  return celdas.some((c) => c.col === col && c.row === row && c.tipo === TIPO_CELDA.FORMA)
}

export function pisosDesdePlantas(plantas) {
  if (!plantas?.length) return []
  return [...plantas].map((p) => p.piso).sort((a, b) => a - b)
}

export function derivePisosDesdePlazasYPlantas(plazas, plantas) {
  const set = new Set()
  plazas.forEach((p) => set.add(p.piso || 1))
  plantas.forEach((p) => set.add(p.piso))
  if (set.size === 0) set.add(1)
  const maxPiso = Math.max(...set, 1)
  for (let i = 1; i <= maxPiso; i++) set.add(i)
  return [...set].sort((a, b) => a - b)
}

export function celdasDelPiso(plantas, piso) {
  return plantas.find((p) => p.piso === piso)?.celdas || []
}
