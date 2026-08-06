import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import GridLines from './GridLines'
import FormaCells from './FormaCells'
import {
  makeGrid,
  editorStageSize,
  snapToGrid,
  cellFromPointer,
  cellsInRect,
  cellKey,
  plazaMetrics,
} from '../utils/plazaLayout'
import { celdaPermitePlaza } from '../utils/plantaForma'
import { colors } from '../theme/colors'

export const HERRAMIENTA_PLAZAS = {
  CREAR: 'CREAR',
  SELECCIONAR: 'SELECCIONAR',
  BORRAR: 'BORRAR',
}

function SelectionRect({ start, end, mode, herramientaPlazas, grid }) {
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
      x={grid.pad + colMin * grid.cell}
      y={grid.pad + rowMin * grid.cell}
      width={(colMax - colMin + 1) * grid.cell}
      height={(rowMax - rowMin + 1) * grid.cell}
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
  grid,
}) {
  const m = plazaMetrics(grid.cell)
  const x = grid.pad + (plaza.posX ?? 0) * grid.cell
  const y = grid.pad + (plaza.posY ?? 0) * grid.cell

  return (
    <>
      <Rect
        x={x}
        y={y}
        width={m.size - m.inset}
        height={m.size - m.inset}
        cornerRadius={Math.max(2, Math.round(grid.cell * 0.12))}
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
          const snapped = snapToGrid(node.x(), node.y(), grid)
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
        y={y + m.labelY}
        width={m.size - m.inset}
        text={plaza.codigo}
        align="center"
        fontSize={m.font}
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
  grid: gridProp,
  onFormaPaint,
  onCellsSelect,
  onPlazaMove,
  selectedIds = [],
  onSelectPlaza,
  onSelectPlazas,
  onDeletePlazas,
  onInvalidPlazaCells,
  pisoGuardado = true,
}) {
  const grid = gridProp || makeGrid()
  const gridRef = useRef(grid)
  gridRef.current = grid

  const selectingRef = useRef(false)
  const selStartRef = useRef(null)
  const selEndRef = useRef(null)
  const [selStart, setSelStart] = useState(null)
  const [selEnd, setSelEnd] = useState(null)
  const { width, height } = editorStageSize(grid)

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

    const libres = allCells.filter(
      (c) =>
        pisoGuardado &&
        !plazasByCell.current.has(cellKey(c.col, c.row)) &&
        celdaPermitePlaza(celdasForma, c.col, c.row, pisoGuardado),
    )

    if (libres.length > 0) {
      onCellsSelect(libres)
    } else if (allCells.length > 0) {
      onInvalidPlazaCells?.()
    }
  }

  function handleSelectStart(e) {
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const cell = cellFromPointer(pointer.x, pointer.y, gridRef.current)
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

    const cell = cellFromPointer(pointer.x, pointer.y, gridRef.current)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listener estable; finishSelection usa refs
  }, [])

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
      ? `PISO ${piso} — dibujar estructura · ${grid.cols}×${grid.rows}`
      : herramientaPlazas === HERRAMIENTA_PLAZAS.BORRAR
        ? `PISO ${piso} — borrar plazas · ${grid.cols}×${grid.rows}`
        : herramientaPlazas === HERRAMIENTA_PLAZAS.SELECCIONAR
          ? `PISO ${piso} — seleccionar · ${grid.cols}×${grid.rows}`
          : `PISO ${piso} — colocar plazas · ${grid.cols}×${grid.rows}`

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
        <FormaCells celdas={celdasForma} grid={grid} />
        <GridLines grid={grid} />
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
          x={grid.pad}
          y={grid.pad}
          width={grid.cols * grid.cell}
          height={grid.rows * grid.cell}
          fill="transparent"
          onMouseDown={handleSelectStart}
          onTouchStart={handleSelectStart}
        />
        <SelectionRect
          start={selStart}
          end={selEnd}
          mode={mode}
          herramientaPlazas={herramientaPlazas}
          grid={grid}
        />
        {mode === 'plazas' &&
          plazasPiso.map((plaza) => (
            <DraggablePlaza
              key={plaza.id}
              plaza={plaza}
              celdasForma={celdasForma}
              selected={selectedSet.has(plaza.id)}
              draggable={allowDrag}
              grid={grid}
              onSelect={handlePlazaClick}
              onDragEnd={onPlazaMove}
            />
          ))}
      </Layer>
    </Stage>
  )
}
