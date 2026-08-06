/** Tipos de celda al dibujar la estructura del estacionamiento. */
export const TIPO_CELDA = {
  FORMA: 'FORMA',
  CIRCULACION: 'CIRCULACION',
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
  OBSTACULO: 'OBSTACULO',
}

export const COLORES_CELDA = {
  FORMA: '#C8D5C0', // área de estacionar (verde cemento suave)
  CIRCULACION: '#B8B4A8', // pasillo / calle
  ENTRADA: '#2E7D32', // ingreso
  SALIDA: '#C62828', // egreso
  OBSTACULO: '#5A5A5A', // columna / pared
}

export const LEYENDA_ESTRUCTURA = [
  { tipo: TIPO_CELDA.FORMA, label: 'Área de plazas', color: COLORES_CELDA.FORMA },
  { tipo: TIPO_CELDA.CIRCULACION, label: 'Pasillo / calle', color: COLORES_CELDA.CIRCULACION },
  { tipo: TIPO_CELDA.ENTRADA, label: 'Entrada', color: COLORES_CELDA.ENTRADA },
  { tipo: TIPO_CELDA.SALIDA, label: 'Salida', color: COLORES_CELDA.SALIDA },
  { tipo: TIPO_CELDA.OBSTACULO, label: 'Obstáculo', color: COLORES_CELDA.OBSTACULO },
]

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

/** Plazas solo sobre celdas FORMA (Área de plazas). Sin área dibujada → no se puede. */
export function celdaPermitePlaza(celdas, col, row, pisoGuardado = true) {
  if (!pisoGuardado) return false
  if (!celdas?.length) return false
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
