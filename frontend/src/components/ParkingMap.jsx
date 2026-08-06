import { Stage, Layer, Rect, Text } from 'react-konva'
import GridLines from './GridLines'
import FormaCells from './FormaCells'
import {
  positionPlazas,
  combinedStageSize,
  makeGrid,
  plazaMetrics,
  GRID_COLS,
  GRID_ROWS,
} from '../utils/plazaLayout'
import { colors, plazaFill, plazaStroke } from '../theme/colors'

function plazaLabel(plaza) {
  if (plaza.patentes?.length > 1) {
    return `${plaza.codigo}\n${plaza.patentes.join('\n')}`
  }
  if (plaza.ocupada || plaza.puedeOtraMoto) {
    return `${plaza.codigo}\n${plaza.patente || plaza.patentes?.[0] || ''}`
  }
  if (plaza.reservada) {
    const abonado = plaza.reservaCliente?.split(' ')[0] || 'Abonado'
    return `${plaza.codigo}\n${abonado}`
  }
  return plaza.codigo
}

export default function ParkingMap({
  plazas,
  piso,
  celdasForma,
  gridCols,
  gridRows,
  selectedId,
  onSelectPlaza,
}) {
  const preferred = makeGrid(gridCols ?? GRID_COLS, gridRows ?? GRID_ROWS)
  const { width, height, grid } = combinedStageSize(plazas, celdasForma, preferred)
  const positioned = positionPlazas(plazas, grid)
  const m = plazaMetrics(grid.cell)

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill={colors.mapCanvas} listening={false} />
        <FormaCells celdas={celdasForma} grid={grid} />
        <GridLines grid={grid} />

        {piso != null && (
          <Text
            x={12}
            y={8}
            text={`PISO ${piso}`}
            fontSize={13}
            fontStyle="bold"
            fill={colors.primary}
            listening={false}
          />
        )}

        {positioned.map((plaza) => {
          const selected = plaza.id === selectedId
          const clickable = !!onSelectPlaza

          return (
            <Rect
              key={plaza.id}
              x={plaza.x}
              y={plaza.y}
              width={m.size - m.inset}
              height={m.size - m.inset}
              cornerRadius={Math.max(2, Math.round(grid.cell * 0.12))}
              fill={plazaFill(plaza, selected)}
              stroke={plazaStroke(plaza, selected)}
              strokeWidth={selected ? 3 : 1.5}
              onClick={() => clickable && onSelectPlaza(plaza)}
              onTap={() => clickable && onSelectPlaza(plaza)}
              listening={clickable}
            />
          )
        })}

        {positioned.map((plaza) => (
          <Text
            key={`label-${plaza.id}`}
            x={plaza.x}
            y={plaza.y + m.labelY}
            width={m.size - m.inset}
            text={plazaLabel(plaza)}
            align="center"
            fontSize={m.font}
            fill={colors.mapText}
            fontStyle="bold"
            listening={false}
          />
        ))}

        {plazas.length === 0 && piso != null && !celdasForma?.length && (
          <Text
            x={width / 2 - 120}
            y={height / 2 - 10}
            width={240}
            text={`Sin plazas en el piso ${piso}`}
            align="center"
            fontSize={14}
            fill={colors.mapTextMuted}
            listening={false}
          />
        )}
      </Layer>
    </Stage>
  )
}
