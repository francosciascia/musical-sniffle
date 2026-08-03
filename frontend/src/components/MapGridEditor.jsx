import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import GridLines from './GridLines'
import FormaCells from './FormaCells'
import {
  GRID_CELL,
  GRID_COLS,
  GRID_PAD,
  GRID_ROWS,
  PLAZA_SIZE,
  PLAZA_INSET,
  PLAZA_FONT,
  PLAZA_LABEL_Y,
  editorStageSize,
  snapToGrid,
  cellFromPointer,
  cellsInRect,
  cellKey,
} from '../utils/plazaLayout'
import { celdaPermitePlaza } from '../utils/plantaForma'
import { colors } from '../theme/colors'

export const HERRAMIENTA_PLAZAS = {
  CREAR: 'CREAR',
  SELECCIONAR: 'SELECCIONAR',
  BORRAR: 'BORRAR',
}

function SelectionRect({ start, end, mode, herramientaPlazas }) {
  if (!start || !end) return null

  const colMin = Math.min(start.col, end.col)
  const colMax = Math.max(start.col, end.col)
  const rowMin = Math.min(start.row, end.row)
  const rowMax = Math.max(start.row, end.row)

  let fill = 'rgba(11, 93, 42, 0.25)'
  let stroke = colors.primary
  if (mode === 'forma') {
    fill = 'rgba(107, 107, 107, 0.35)'
    stroke = colors.formaObstaculo
  } else if (herramientaPlazas === HERRAMIENTA_PLAZAS.BORRAR) {
    fill = 'rgba(198, 40, 40, 0.28)'
    stroke = colors.ocupada
  } else if (herramientaPlazas === HERRAMIENTA_PLAZAS.SELECCIONAR) {
    fill = 'rgba(245, 196, 0, 0.28)'
    stroke = colors.accentDark
  }

  return (
    <Rect
      x={GRID_PAD + colMin * GRID_CELL}
      y={GRID_PAD + rowMin * GRID_CELL}
      width={(colMax - colMin + 1) * GRID_CELL}
      height={(rowMax - rowMin + 1) * GRID_CELL}
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
      dash={[6, 4]}
      listening={false}
    />
  )
}

function DraggablePlaza({
  plaza,
  celdasForma,
  onDragEnd,
  onSelect,
  selected,
  draggable,
}) {
  const x = GRID_PAD + (plaza.posX ?? 0) * GRID_CELL
  const y = GRID_PAD + (plaza.posY ?? 0) * GRID_CELL

  return (
    <>
      <Rect
        x={x}
        y={y}
        width={PLAZA_SIZE - PLAZA_INSET}
        height={PLAZA_SIZE - PLAZA_INSET}
        cornerRadius={6}
        fill={plaza.activa ? colors.primary : colors.fueraServicio}
        stroke={selected ? colors.accent : colors.primaryDark}
        strokeWidth={selected ? 3 : 2}
        draggable={draggable}
        onMouseDown={(e) => {
          e.cancelBubble = true
        }}
        onClick={(e) => {
          e.cancelBubble = true
          const multi = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey
          onSelect(plaza, { multi })
        }}
        onTap={(e) => {
          e.cancelBubble = true
          onSelect(plaza, { multi: false })
        }}
        onDragEnd={(e) => {
          const node = e.target
          const snapped = snapToGrid(node.x(), node.y())
          if (!celdaPermitePlaza(celdasForma, snapped.col, snapped.row, true)) {
            node.position({ x, y })
            return
          }
          node.position({ x: snapped.x, y: snapped.y })
          onDragEnd(plaza, snapped.col, snapped.row)
        }}
      />
      <Text
        x={x}
        y={y + PLAZA_LABEL_Y}
        width={PLAZA_SIZE - PLAZA_INSET}
        text={plaza.codigo}
        align="center"
        fontSize={PLAZA_FONT + 1}
        fill={colors.mapText}
        fontStyle="bold"
        listening={false}
      />
    </>
  )
}

export default function MapGridEditor({
  mode,
  herramienta,
  herramientaPlazas = HERRAMIENTA_PLAZAS.CREAR,
  celdasForma,
  plazas,
  piso,
  onFormaPaint,
  onCellsSelect,
  onPlazaMove,
  selectedIds = [],
  onSelectPlaza,
  onSelectPlazas,
  onDeletePlazas,
  pisoGuardado = true,
}) {
  const selectingRef = useRef(false)
  const selStartRef = useRef(null)
  const selEndRef = useRef(null)
  const [selStart, setSelStart] = useState(null)
  const [selEnd, setSelEnd] = useState(null)
  const { width, height } = editorStageSize()

  const plazasPiso = plazas.filter((p) => p.piso === piso)
  const selectedSet = new Set(selectedIds)

  const plazasByCell = useRef(new Map())
  plazasByCell.current = new Map(
    plazasPiso.map((p) => [cellKey(p.posX ?? 0, p.posY ?? 0), p]),
  )

  function plazasEnCeldas(cells) {
    const found = []
    for (const c of cells) {
      const plaza = plazasByCell.current.get(cellKey(c.col, c.row))
      if (plaza) found.push(plaza)
    }
    return found
  }

  function finishSelection(endCell) {
    if (!selectingRef.current || !selStartRef.current) return

    selectingRef.current = false
    const start = selStartRef.current
    selStartRef.current = null
    setSelStart(null)
    setSelEnd(null)

    const allCells = cellsInRect(start, endCell)

    if (mode === 'forma') {
      onFormaPaint?.(allCells, herramienta)
      return
    }

    const existentes = plazasEnCeldas(allCells)

    if (herramientaPlazas === HERRAMIENTA_PLAZAS.BORRAR) {
      if (existentes.length > 0) onDeletePlazas?.(existentes)
      return
    }

    if (herramientaPlazas === HERRAMIENTA_PLAZAS.SELECCIONAR) {
      onSelectPlazas?.(existentes)
      return
    }

    // CREAR: solo celdas vacías permitidas
    const libres = allCells.filter(
      (c) =>
        pisoGuardado &&
        !plazasByCell.current.has(cellKey(c.col, c.row)) &&
        celdaPermitePlaza(celdasForma, c.col, c.row, pisoGuardado),
    )

    if (libres.length > 0) {
      onCellsSelect(libres)
    }
  }

  function handleSelectStart(e) {
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const cell = cellFromPointer(pointer.x, pointer.y)
    selectingRef.current = true
    selStartRef.current = cell
    setSelStart(cell)
    setSelEnd(cell)
    selEndRef.current = cell
  }

  function handleSelectMove(e) {
    if (!selectingRef.current) return

    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const cell = cellFromPointer(pointer.x, pointer.y)
    setSelEnd(cell)
    selEndRef.current = cell
  }

  useEffect(() => {
    function handleWindowMouseUp() {
      if (!selectingRef.current || !selStartRef.current) return
      finishSelection(selEndRef.current ?? selStartRef.current)
    }

    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => window.removeEventListener('mouseup', handleWindowMouseUp)
  })

  function handleSelectEnd() {
    if (!selectingRef.current || !selStartRef.current) return
    finishSelection(selEndRef.current ?? selStartRef.current)
  }

  function handlePlazaClick(plaza, { multi }) {
    if (herramientaPlazas === HERRAMIENTA_PLAZAS.BORRAR) {
      onDeletePlazas?.([plaza])
      return
    }
    onSelectPlaza?.(plaza, { multi: multi || herramientaPlazas === HERRAMIENTA_PLAZAS.SELECCIONAR })
  }

  const titulo =
    mode === 'forma'
      ? `PISO ${piso} — dibujar forma`
      : herramientaPlazas === HERRAMIENTA_PLAZAS.BORRAR
        ? `PISO ${piso} — borrar plazas`
        : herramientaPlazas === HERRAMIENTA_PLAZAS.SELECCIONAR
          ? `PISO ${piso} — seleccionar`
          : `PISO ${piso} — colocar plazas`

  const allowDrag = herramientaPlazas === HERRAMIENTA_PLAZAS.CREAR

  return (
    <Stage
      width={width}
      height={height}
      onMouseMove={handleSelectMove}
      onMouseUp={handleSelectEnd}
      onTouchMove={handleSelectMove}
      onTouchEnd={handleSelectEnd}
    >
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill={colors.mapCanvas} listening={false} />
        <FormaCells celdas={celdasForma} />
        <GridLines />
        <Text
          x={12}
          y={8}
          text={titulo}
          fontSize={13}
          fontStyle="bold"
          fill={colors.primary}
          listening={false}
        />
        <Rect
          x={GRID_PAD}
          y={GRID_PAD}
          width={GRID_COLS * GRID_CELL}
          height={GRID_ROWS * GRID_CELL}
          fill="transparent"
          onMouseDown={handleSelectStart}
          onTouchStart={handleSelectStart}
        />
        <SelectionRect
          start={selStart}
          end={selEnd}
          mode={mode}
          herramientaPlazas={herramientaPlazas}
        />
        {mode === 'plazas' &&
          plazasPiso.map((plaza) => (
            <DraggablePlaza
              key={plaza.id}
              plaza={plaza}
              celdasForma={celdasForma}
              selected={selectedSet.has(plaza.id)}
              draggable={allowDrag}
              onSelect={handlePlazaClick}
              onDragEnd={onPlazaMove}
            />
          ))}
      </Layer>
    </Stage>
  )
}
