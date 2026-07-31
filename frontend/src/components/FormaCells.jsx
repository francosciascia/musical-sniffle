import { Rect } from 'react-konva'
import { GRID_CELL, GRID_PAD } from '../utils/plazaLayout'
import { COLORES_CELDA } from '../utils/plantaForma'

export default function FormaCells({ celdas }) {
  if (!celdas?.length) return null

  return celdas.map((c) => (
    <Rect
      key={`forma-${c.col}-${c.row}`}
      x={GRID_PAD + c.col * GRID_CELL}
      y={GRID_PAD + c.row * GRID_CELL}
      width={GRID_CELL}
      height={GRID_CELL}
      fill={COLORES_CELDA[c.tipo] || '#eee'}
      listening={false}
    />
  ))
}
