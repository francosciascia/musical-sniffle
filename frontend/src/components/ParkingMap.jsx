import { useLayoutEffect, useMemo, useRef, useState } from 'react'
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

function MapStage({
  width,
  height,
  grid,
  positioned,
  plazas,
  celdasForma,
  piso,
  selectedId,
  onSelectPlaza,
  scale = 1,
}) {
  const m = plazaMetrics(grid.cell)
  const stageW = Math.max(1, Math.floor(width * scale))
  const stageH = Math.max(1, Math.floor(height * scale))

  return (
    <Stage width={stageW} height={stageH} scaleX={scale} scaleY={scale}>
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

export default function ParkingMap({
  plazas,
  piso,
  celdasForma,
  gridCols,
  gridRows,
  selectedId,
  onSelectPlaza,
  /** Si true, escala el plano al tamaño del contenedor (sin scroll). */
  fit = false,
}) {
  const preferred = useMemo(
    () => makeGrid(gridCols ?? GRID_COLS, gridRows ?? GRID_ROWS),
    [gridCols, gridRows],
  )
  const { width, height, grid } = useMemo(
    () => combinedStageSize(plazas, celdasForma, preferred),
    [plazas, celdasForma, preferred],
  )
  const positioned = useMemo(() => positionPlazas(plazas, grid), [plazas, grid])

  const containerRef = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    if (!fit) return undefined
    const el = containerRef.current
    if (!el) return undefined

    const measure = () => {
      setBox({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  if (!fit) {
    return (
      <MapStage
        width={width}
        height={height}
        grid={grid}
        positioned={positioned}
        plazas={plazas}
        celdasForma={celdasForma}
        piso={piso}
        selectedId={selectedId}
        onSelectPlaza={onSelectPlaza}
      />
    )
  }

  const pad = 8
  const scale =
    box.w > 0 && box.h > 0
      ? Math.min(1, (box.w - pad * 2) / width, (box.h - pad * 2) / height)
      : 1

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <MapStage
        width={width}
        height={height}
        grid={grid}
        positioned={positioned}
        plazas={plazas}
        celdasForma={celdasForma}
        piso={piso}
        selectedId={selectedId}
        onSelectPlaza={onSelectPlaza}
        scale={scale}
      />
    </div>
  )
}
