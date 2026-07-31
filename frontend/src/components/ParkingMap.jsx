import { Stage, Layer, Rect, Text } from 'react-konva'
import GridLines from './GridLines'
import FormaCells from './FormaCells'
import {
  positionPlazas,
  combinedStageSize,
  PLAZA_SIZE,
  PLAZA_INSET,
  PLAZA_FONT,
  PLAZA_LABEL_Y,
} from '../utils/plazaLayout'

function plazaColor(plaza, selected) {
  if (!plaza.activa) return '#bdbdbd'
  if (plaza.ocupada) return '#ef5350'
  if (plaza.reservada) return '#ff9800'
  if (selected) return '#42a5f5'
  return '#66bb6a'
}

function plazaLabel(plaza) {
  if (plaza.ocupada) {
    return `${plaza.codigo}\n${plaza.patente || ''}`
  }
  if (plaza.reservada) {
    const abonado = plaza.reservaCliente?.split(' ')[0] || 'Abonado'
    return `${plaza.codigo}\n${abonado}`
  }
  return plaza.codigo
}

export default function ParkingMap({ plazas, piso, celdasForma, selectedId, onSelectPlaza }) {
  const { width, height } = combinedStageSize(plazas, celdasForma)

  const positioned = positionPlazas(plazas)

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill="#fafafa" listening={false} />
        <FormaCells celdas={celdasForma} />
        <GridLines />

        {piso != null && (
          <Text
            x={12}
            y={8}
            text={`PISO ${piso}`}
            fontSize={13}
            fontStyle="bold"
            fill="#1565c0"
            listening={false}
          />
        )}

        {positioned.map((plaza) => {
          const selected = plaza.id === selectedId
          const clickable = plaza.activa && !plaza.ocupada && onSelectPlaza

          return (
            <Rect
              key={plaza.id}
              x={plaza.x}
              y={plaza.y}
              width={PLAZA_SIZE - PLAZA_INSET}
              height={PLAZA_SIZE - PLAZA_INSET}
              cornerRadius={8}
              fill={plazaColor(plaza, selected)}
              stroke={selected ? '#0d47a1' : plaza.reservada ? '#e65100' : '#333'}
              strokeWidth={selected ? 3 : 2}
              onClick={() => clickable && onSelectPlaza(plaza)}
              onTap={() => clickable && onSelectPlaza(plaza)}
              listening={!!clickable}
            />
          )
        })}

        {positioned.map((plaza) => (
          <Text
            key={`label-${plaza.id}`}
            x={plaza.x}
            y={plaza.y + PLAZA_LABEL_Y}
            width={PLAZA_SIZE - PLAZA_INSET}
            text={plazaLabel(plaza)}
            align="center"
            fontSize={PLAZA_FONT}
            fill="#fff"
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
            fill="#757575"
            listening={false}
          />
        )}
      </Layer>
    </Stage>
  )
}
