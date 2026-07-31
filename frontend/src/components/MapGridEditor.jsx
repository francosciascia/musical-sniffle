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

function SelectionRect({ start, end, mode }) {
  if (!start || !end) return null

  const colMin = Math.min(start.col, end.col)
  const colMax = Math.max(start.col, end.col)
  const rowMin = Math.min(start.row, end.row)
  const rowMax = Math.max(start.row, end.row)

  return (
    <Rect
      x={GRID_PAD + colMin * GRID_CELL}
      y={GRID_PAD + rowMin * GRID_CELL}
      width={(colMax - colMin + 1) * GRID_CELL}
      height={(rowMax - rowMin + 1) * GRID_CELL}
      fill={mode === 'forma' ? 'rgba(96, 125, 139, 0.35)' : 'rgba(21, 101, 192, 0.25)'}
      stroke={mode === 'forma' ? '#546e7a' : '#1565c0'}
      strokeWidth={2}
      dash={[6, 4]}
      listening={false}
    />
  )
}

function DraggablePlaza({ plaza, celdasForma, onDragEnd, onSelect, selected }) {
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
        fill={plaza.activa ? '#1565c0' : '#bdbdbd'}
        stroke={selected ? '#ffeb3b' : '#0d47a1'}
        strokeWidth={selected ? 3 : 2}
        draggable
        onMouseDown={(e) => {
          e.cancelBubble = true
        }}
        onClick={(e) => {
          e.cancelBubble = true
          onSelect(plaza)
        }}
        onTap={(e) => {
          e.cancelBubble = true
          onSelect(plaza)
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
        fill="#fff"
        fontStyle="bold"
        listening={false}
      />
    </>
  )
}

export default function MapGridEditor({
  mode,
  herramienta,
  celdasForma,
  plazas,
  piso,
  onFormaPaint,
  onCellsSelect,
  onPlazaMove,
  selectedId,
  onSelectPlaza,
  pisoGuardado = true,
}) {
  const selectingRef = useRef(false)
  const selStartRef = useRef(null)
  const selEndRef = useRef(null)
  const [selStart, setSelStart] = useState(null)
  const [selEnd, setSelEnd] = useState(null)
  const { width, height } = editorStageSize()

  const plazasPiso = plazas.filter((p) => p.piso === piso)

  const ocupadasEnPiso = useRef(new Set())
  ocupadasEnPiso.current = new Set(
    plazasPiso.map((p) => cellKey(p.posX ?? 0, p.posY ?? 0)),
  )

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

    const libres = allCells.filter(
      (c) =>
        pisoGuardado &&
        !ocupadasEnPiso.current.has(cellKey(c.col, c.row)) &&
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

  const titulo =
    mode === 'forma'
      ? `PISO ${piso} — dibujar forma`
      : `PISO ${piso} — colocar plazas`

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
        <Rect x={0} y={0} width={width} height={height} fill="#fafafa" listening={false} />
        <FormaCells celdas={celdasForma} />
        <GridLines />
        <Text
          x={12}
          y={8}
          text={titulo}
          fontSize={13}
          fontStyle="bold"
          fill="#1565c0"
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
        <SelectionRect start={selStart} end={selEnd} mode={mode} />
        {mode === 'plazas' &&
          plazasPiso.map((plaza) => (
            <DraggablePlaza
              key={plaza.id}
              plaza={plaza}
              celdasForma={celdasForma}
              selected={plaza.id === selectedId}
              onSelect={onSelectPlaza}
              onDragEnd={onPlazaMove}
            />
          ))}
      </Layer>
    </Stage>
  )
}
