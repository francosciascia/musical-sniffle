import { Line } from 'react-konva'
import { GRID_CELL, GRID_COLS, GRID_PAD, GRID_ROWS } from '../utils/plazaLayout'

export default function GridLines() {
  const lines = []
  for (let c = 0; c <= GRID_COLS; c++) {
    const x = GRID_PAD + c * GRID_CELL
    lines.push(
      <Line
        key={`v-${c}`}
        points={[x, GRID_PAD, x, GRID_PAD + GRID_ROWS * GRID_CELL]}
        stroke="#e0e0e0"
        strokeWidth={1}
        listening={false}
      />,
    )
  }
  for (let r = 0; r <= GRID_ROWS; r++) {
    const y = GRID_PAD + r * GRID_CELL
    lines.push(
      <Line
        key={`h-${r}`}
        points={[GRID_PAD, y, GRID_PAD + GRID_COLS * GRID_CELL, y]}
        stroke="#e0e0e0"
        strokeWidth={1}
        listening={false}
      />,
    )
  }
  return lines
}
