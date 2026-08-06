import { Line } from 'react-konva'
import { GRID_PAD, makeGrid } from '../utils/plazaLayout'
import { colors } from '../theme/colors'

export default function GridLines({ grid: gridProp }) {
  const grid = gridProp || makeGrid()
  const cell = grid.cell
  const pad = grid.pad ?? GRID_PAD
  const lines = []

  for (let c = 0; c <= grid.cols; c++) {
    const x = pad + c * cell
    lines.push(
      <Line
        key={`v-${c}`}
        points={[x, pad, x, pad + grid.rows * cell]}
        stroke={colors.mapGrid}
        strokeWidth={1}
        listening={false}
      />,
    )
  }
  for (let r = 0; r <= grid.rows; r++) {
    const y = pad + r * cell
    lines.push(
      <Line
        key={`h-${r}`}
        points={[pad, y, pad + grid.cols * cell, y]}
        stroke={colors.mapGrid}
        strokeWidth={1}
        listening={false}
      />,
    )
  }
  return lines
}
