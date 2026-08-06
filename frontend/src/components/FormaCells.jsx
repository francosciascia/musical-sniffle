import { Rect, Text } from 'react-konva'
import { GRID_PAD, GRID_CELL, makeGrid } from '../utils/plazaLayout'
import { COLORES_CELDA, TIPO_CELDA } from '../utils/plantaForma'

const LABEL = {
  [TIPO_CELDA.ENTRADA]: 'IN',
  [TIPO_CELDA.SALIDA]: 'OUT',
  [TIPO_CELDA.OBSTACULO]: '■',
  [TIPO_CELDA.CIRCULACION]: '',
  [TIPO_CELDA.FORMA]: '',
}

export default function FormaCells({ celdas, grid: gridProp }) {
  if (!celdas?.length) return null

  const grid = gridProp || makeGrid()
  const cell = grid.cell || GRID_CELL
  const pad = grid.pad ?? GRID_PAD
  const fontSize = Math.max(7, Math.round(cell * 0.22))

  return celdas.flatMap((c) => {
    const x = pad + c.col * cell
    const y = pad + c.row * cell
    const fill = COLORES_CELDA[c.tipo] || '#eee'
    const label = LABEL[c.tipo] || ''
    const nodes = [
      <Rect
        key={`forma-${c.col}-${c.row}`}
        x={x}
        y={y}
        width={cell}
        height={cell}
        fill={fill}
        listening={false}
      />,
    ]
    if (label) {
      nodes.push(
        <Text
          key={`forma-lbl-${c.col}-${c.row}`}
          x={x}
          y={y + cell / 2 - fontSize / 2}
          width={cell}
          text={label}
          align="center"
          fontSize={fontSize}
          fontStyle="bold"
          fill="#fff"
          listening={false}
        />,
      )
    }
    return nodes
  })
}
