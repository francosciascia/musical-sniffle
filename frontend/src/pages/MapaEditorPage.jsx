import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, LayoutGrid, Map as MapIcon } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import MapGridEditor, { HERRAMIENTA_PLAZAS } from '../components/MapGridEditor'
import api from '../api/client'
import { colors } from '../theme/colors'
import {
  GRID_COLS,
  GRID_MAX_COLS,
  GRID_MAX_ROWS,
  GRID_MIN,
  GRID_PRESETS,
  GRID_ROWS,
  makeGrid,
  matchPreset,
  nextPlazaCodigos,
} from '../utils/plazaLayout'
import {
  applyPaint,
  celdaPermitePlaza,
  celdasDelPiso,
  LEYENDA_ESTRUCTURA,
  pisosDesdePlantas,
  TIPO_CELDA,
} from '../utils/plantaForma'

const MODO = {
  ESTRUCTURA: 'estructura',
  LUGARES: 'plazas',
}

export default function MapaEditorPage() {
  const navigate = useNavigate()
  const [plazas, setPlazas] = useState([])
  const [plantas, setPlantas] = useState([])
  const [pisoActual, setPisoActual] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [creando, setCreando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [modo, setModo] = useState(MODO.ESTRUCTURA)
  const [herramienta, setHerramienta] = useState(TIPO_CELDA.FORMA)
  const [herramientaPlazas, setHerramientaPlazas] = useState(HERRAMIENTA_PLAZAS.CREAR)
  const [crearDialogOpen, setCrearDialogOpen] = useState(false)
  const [newCols, setNewCols] = useState(String(GRID_COLS))
  const [newRows, setNewRows] = useState(String(GRID_ROWS))
  const celdasRef = useRef([])
  const pisoRef = useRef(null)
  const saveChainRef = useRef(Promise.resolve())

  const crearPresetId = matchPreset(Number(newCols), Number(newRows))?.id || 'custom'

  const cargar = useCallback(async () => {
    setError('')
    try {
      const [resPlazas, resPlantas] = await Promise.all([
        api.get('/admin/plazas'),
        api.get('/admin/plantas'),
      ])
      setPlazas(resPlazas.data)
      setPlantas(resPlantas.data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los datos')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const pisos = useMemo(() => pisosDesdePlantas(plantas), [plantas])

  useEffect(() => {
    if (pisos.length === 0) {
      setPisoActual(null)
      return
    }
    if (pisoActual == null || !pisos.includes(pisoActual)) {
      setPisoActual(pisos[0])
    }
  }, [pisos, pisoActual])

  useEffect(() => {
    setSelectedIds([])
  }, [pisoActual, herramientaPlazas, modo])

  const celdasForma = useMemo(
    () => (pisoActual != null ? celdasDelPiso(plantas, pisoActual) : []),
    [plantas, pisoActual],
  )

  const plantaActual = useMemo(
    () => (pisoActual != null ? plantas.find((p) => p.piso === pisoActual) : null),
    [plantas, pisoActual],
  )

  const grid = useMemo(
    () => makeGrid(plantaActual?.gridCols ?? GRID_COLS, plantaActual?.gridRows ?? GRID_ROWS),
    [plantaActual],
  )

  useEffect(() => {
    celdasRef.current = celdasForma
    pisoRef.current = pisoActual
  }, [celdasForma, pisoActual])

  const plazasPiso = useMemo(
    () => (pisoActual != null ? plazas.filter((p) => p.piso === pisoActual) : []),
    [plazas, pisoActual],
  )

  const selectedPlazas = useMemo(
    () => plazasPiso.filter((p) => selectedIds.includes(p.id)),
    [plazasPiso, selectedIds],
  )

  const pisoGuardado = pisoActual != null && plantas.some((p) => p.piso === pisoActual)

  function abrirCrearPiso() {
    setNewCols(String(GRID_COLS))
    setNewRows(String(GRID_ROWS))
    setCrearDialogOpen(true)
  }

  async function confirmarCrearPiso() {
    setGuardando(true)
    setError('')
    setOk('')
    try {
      const { data } = await api.post('/admin/plantas', {
        gridCols: Number(newCols),
        gridRows: Number(newRows),
      })
      setPlantas((prev) => [...prev, data].sort((a, b) => a.piso - b.piso))
      setPisoActual(data.piso)
      setModo(MODO.ESTRUCTURA)
      setCrearDialogOpen(false)
      setOk(
        `Piso ${data.piso} creado (${data.gridCols}×${data.gridRows}). Dibujá la estructura y después los lugares.`,
      )
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el piso')
    } finally {
      setGuardando(false)
    }
  }

  async function crearPisoCopiandoAnterior() {
    if (pisos.length === 0) {
      setError('No hay piso anterior para copiar')
      return
    }
    const origen = Math.max(...pisos)
    if (!window.confirm(
      `¿Crear piso ${origen + 1} copiando estructura y lugares del piso ${origen}?`,
    )) {
      return
    }
    setGuardando(true)
    setError('')
    setOk('')
    try {
      const { data } = await api.post('/admin/plantas/copiar-anterior')
      setOk(
        `Piso ${data.pisoDestino} creado desde piso ${data.pisoOrigen}` +
          (data.plazasCopiadas ? ` · ${data.plazasCopiadas} lugares` : ''),
      )
      await cargar()
      setPisoActual(data.pisoDestino)
      setModo(MODO.ESTRUCTURA)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el piso copiado')
    } finally {
      setGuardando(false)
    }
  }

  async function copiarDelPisoAnterior() {
    if (pisoActual == null || pisoActual <= 1) return
    const origen = pisoActual - 1
    if (!pisos.includes(origen)) {
      setError(`No existe el piso ${origen}`)
      return
    }
    const plazasDestino = plazas.filter((p) => p.piso === pisoActual).length
    const msg =
      plazasDestino > 0
        ? `¿Reemplazar estructura y ${plazasDestino} lugares del piso ${pisoActual} con la distribución del piso ${origen}?`
        : `¿Copiar estructura y lugares del piso ${origen} al piso ${pisoActual}?`
    if (!window.confirm(msg)) return

    setGuardando(true)
    setError('')
    setOk('')
    try {
      const { data } = await api.post(`/admin/plantas/${pisoActual}/copiar-desde`, null, {
        params: { origen },
      })
      celdasRef.current = data.planta?.celdas || []
      setOk(
        `Copiado del piso ${data.pisoOrigen}: ${(data.planta?.celdas || []).length} celdas` +
          (data.plazasCopiadas ? ` · ${data.plazasCopiadas} lugares` : ''),
      )
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo copiar la distribución')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarPiso(piso) {
    if (!window.confirm(`¿Eliminar el piso ${piso}? (solo si no tiene lugares)`)) return
    setError('')
    try {
      await api.delete(`/admin/plantas/${piso}`)
      setOk(`Piso ${piso} eliminado`)
      if (pisoActual === piso) setPisoActual(null)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el piso')
    }
  }

  function aplicarCeldasLocal(piso, celdas) {
    setPlantas((prev) => {
      const rest = prev.filter((p) => p.piso !== piso)
      const actual = prev.find((p) => p.piso === piso) || { piso, celdas: [] }
      return [...rest, { ...actual, celdas }].sort((a, b) => a.piso - b.piso)
    })
  }

  function pintarContorno(cells, tool) {
    const piso = pisoRef.current
    if (piso == null) return

    const nuevas = applyPaint(celdasRef.current, cells, tool)
    celdasRef.current = nuevas
    aplicarCeldasLocal(piso, nuevas)
    setGuardando(true)
    setError('')

    saveChainRef.current = saveChainRef.current
      .then(async () => {
        // Siempre manda el último estado acumulado de este piso
        const payload = celdasRef.current
        const { data } = await api.put(`/admin/plantas/${piso}`, { celdas: payload })
        if (pisoRef.current === piso) {
          celdasRef.current = data.celdas || payload
          aplicarCeldasLocal(piso, celdasRef.current)
        }
        setOk(`Piso ${piso}: estructura guardada (${(data.celdas || payload).length} celdas)`)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'No se pudo guardar la estructura')
        // Recargar para no quedar desfasado
        return cargar()
      })
      .finally(() => {
        setGuardando(false)
      })
  }

  async function crearPlazasEnCeldas(celdas) {
    if (!celdas.length || creando || pisoActual == null) return

    if (!pisoGuardado) {
      setError('Primero creá y guardá un piso con el botón "Crear piso".')
      return
    }

    const permitidas = celdas.filter((c) =>
      celdaPermitePlaza(celdasForma, c.col, c.row, pisoGuardado),
    )
    if (!permitidas.length) {
      setError(
        'Solo podés poner lugares sobre el Área de plazas. En Estructura pintá “Área de plazas” y volvé a Lugares.',
      )
      return
    }
    if (permitidas.length < celdas.length) {
      setOk(`Se omitieron ${celdas.length - permitidas.length} celdas fuera del área de plazas`)
    }

    setCreando(true)
    setError('')
    if (permitidas.length === celdas.length) setOk('')
    setSelectedIds([])

    const codigos = nextPlazaCodigos(plazas, permitidas.length, pisoActual)

    try {
      for (let i = 0; i < permitidas.length; i++) {
        await api.post('/admin/plazas', {
          codigo: codigos[i],
          activa: true,
          piso: pisoActual,
          posX: permitidas[i].col,
          posY: permitidas[i].row,
        })
      }

      const preview =
        permitidas.length <= 5
          ? codigos.join(', ')
          : `${codigos.slice(0, 3).join(', ')}… (+${permitidas.length - 3} más)`
      setOk(`Creados: ${preview}`)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron crear las plazas')
    } finally {
      setCreando(false)
    }
  }

  async function moverPlaza(plaza, col, row) {
    try {
      await api.put(`/admin/plazas/${plaza.id}`, {
        codigo: plaza.codigo,
        activa: plaza.activa,
        piso: plaza.piso,
        posX: col,
        posY: row,
      })
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo mover la plaza')
      await cargar()
    }
  }

  function handleSelectPlaza(plaza, { multi } = {}) {
    setSelectedIds((prev) => {
      if (multi) {
        return prev.includes(plaza.id)
          ? prev.filter((id) => id !== plaza.id)
          : [...prev, plaza.id]
      }
      return [plaza.id]
    })
  }

  function handleSelectPlazas(lista) {
    setSelectedIds(lista.map((p) => p.id))
  }

  async function eliminarPlazas(lista) {
    if (!lista?.length) return
    const msg =
      lista.length === 1 ? `¿Eliminar ${lista[0].codigo}?` : `¿Eliminar ${lista.length} lugares?`
    if (!window.confirm(msg)) return
    setError('')
    for (const plaza of lista) {
      try {
        await api.delete(`/admin/plazas/${plaza.id}`)
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo eliminar')
      }
    }
    setSelectedIds([])
    await cargar()
  }

  async function toggleActivas(lista, activa) {
    for (const plaza of lista) {
      try {
        await api.put(`/admin/plazas/${plaza.id}`, {
          codigo: plaza.codigo,
          activa,
          piso: plaza.piso,
          posX: plaza.posX,
          posY: plaza.posY,
        })
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo actualizar')
      }
    }
    await cargar()
  }

  return (
    <AppLayout maxWidth="xl">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Diseñar estacionamiento
        </Typography>
        <Button size="small" startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/config')}>
          Volver a configuración
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Primero dibujá la estructura del piso (pasillos, entradas, área de plazas). Después colocá los
        lugares A1, B1…
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk('')}>
          {ok}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Pisos guardados
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {pisos.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Todavía no hay pisos. Creá el primero.
            </Typography>
          )}
          {pisos.map((p) => {
            const count = plazas.filter((pl) => pl.piso === p).length
            const planta = plantas.find((x) => x.piso === p)
            const celdas = planta?.celdas?.length || 0
            const grilla =
              planta?.gridCols && planta?.gridRows ? ` · ${planta.gridCols}×${planta.gridRows}` : ''
            return (
              <Chip
                key={p}
                label={`Piso ${p}${celdas ? ` · ${celdas} celdas` : ''}${count ? ` · ${count} lugares` : ''}${grilla}`}
                color={pisoActual === p ? 'primary' : 'default'}
                onClick={() => setPisoActual(p)}
                onDelete={() => eliminarPiso(p)}
              />
            )
          })}
          <Button variant="contained" size="small" onClick={abrirCrearPiso} disabled={guardando}>
            {guardando ? 'Guardando…' : '+ Crear piso'}
          </Button>
          {pisos.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Copy size={14} />}
              onClick={crearPisoCopiandoAnterior}
              disabled={guardando}
            >
              Crear piso copiando el anterior
            </Button>
          )}
        </Box>
      </Paper>

      {pisoActual != null && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Tabs value={pisoActual} onChange={(_, v) => setPisoActual(v)}>
              {pisos.map((p) => (
                <Tab key={p} label={`Piso ${p}`} value={p} />
              ))}
            </Tabs>
            {pisoActual > 1 && pisos.includes(pisoActual - 1) && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Copy size={14} />}
                onClick={copiarDelPisoAnterior}
                disabled={guardando}
              >
                Copiar del piso {pisoActual - 1}
              </Button>
            )}
            {(creando || guardando) && <CircularProgress size={22} />}
          </Box>

          <ToggleButtonGroup
            value={modo}
            exclusive
            onChange={(_, v) => v && setModo(v)}
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value={MODO.ESTRUCTURA} sx={{ gap: 0.75, px: 1.5 }}>
              <MapIcon size={16} />
              Estructura
            </ToggleButton>
            <ToggleButton value={MODO.LUGARES} sx={{ gap: 0.75, px: 1.5 }}>
              <LayoutGrid size={16} />
              Lugares
            </ToggleButton>
          </ToggleButtonGroup>

          {modo === MODO.ESTRUCTURA && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Dibujar el estacionamiento
              </Typography>
              <ToggleButtonGroup
                value={herramienta}
                exclusive
                onChange={(_, v) => v && setHerramienta(v)}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                <ToggleButton value={TIPO_CELDA.FORMA}>Área de plazas</ToggleButton>
                <ToggleButton value={TIPO_CELDA.CIRCULACION}>Pasillo</ToggleButton>
                <ToggleButton value={TIPO_CELDA.ENTRADA}>Entrada</ToggleButton>
                <ToggleButton value={TIPO_CELDA.SALIDA}>Salida</ToggleButton>
                <ToggleButton value={TIPO_CELDA.OBSTACULO}>Obstáculo</ToggleButton>
                <ToggleButton value="BORRAR">Borrar</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Arrastrá sobre la grilla para pintar. Los lugares (modo Lugares) solo se pueden poner
                sobre “Área de plazas”.
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                {LEYENDA_ESTRUCTURA.map((item) => (
                  <Stack key={item.tipo} direction="row" spacing={0.5} alignItems="center">
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '2px',
                        bgcolor: item.color,
                        border: `1px solid ${colors.border}`,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {modo === MODO.LUGARES && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Lugares de estacionamiento
              </Typography>
              <ToggleButtonGroup
                value={herramientaPlazas}
                exclusive
                onChange={(_, v) => v && setHerramientaPlazas(v)}
                size="small"
              >
                <ToggleButton value={HERRAMIENTA_PLAZAS.CREAR}>Crear</ToggleButton>
                <ToggleButton value={HERRAMIENTA_PLAZAS.SELECCIONAR}>Seleccionar</ToggleButton>
                <ToggleButton value={HERRAMIENTA_PLAZAS.BORRAR}>Borrar</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Solo sobre el Área de plazas (verde claro). Pasillos, entradas y obstáculos no admiten
                lugares. Códigos: piso 1 → A1…, piso 2 → B1…
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Grilla del piso: {grid.cols}×{grid.rows}
          </Typography>

          <Paper sx={{ p: 2, display: 'inline-block', overflow: 'auto', maxWidth: '100%' }}>
            <MapGridEditor
              mode={modo === MODO.ESTRUCTURA ? 'forma' : 'plazas'}
              herramienta={herramienta}
              herramientaPlazas={herramientaPlazas}
              celdasForma={celdasForma}
              plazas={plazas}
              piso={pisoActual}
              grid={grid}
              pisoGuardado={pisoGuardado}
              selectedIds={selectedIds}
              onFormaPaint={pintarContorno}
              onCellsSelect={crearPlazasEnCeldas}
              onPlazaMove={moverPlaza}
              onSelectPlaza={handleSelectPlaza}
              onSelectPlazas={handleSelectPlazas}
              onDeletePlazas={eliminarPlazas}
              onInvalidPlazaCells={() =>
                setError(
                  'Solo podés poner lugares sobre el Área de plazas. En Estructura pintá “Área de plazas” y volvé a Lugares.',
                )
              }
            />
          </Paper>

          {modo === MODO.LUGARES && selectedPlazas.length > 0 && (
            <Paper sx={{ p: 2, mt: 2, maxWidth: 520 }}>
              <Typography variant="subtitle1">
                {selectedPlazas.length === 1
                  ? selectedPlazas[0].codigo
                  : `${selectedPlazas.length} lugares seleccionados`}
              </Typography>
              {selectedPlazas.length === 1 && (
                <Typography variant="body2">
                  Celda ({selectedPlazas[0].posX}, {selectedPlazas[0].posY}) — Piso{' '}
                  {selectedPlazas[0].piso}
                </Typography>
              )}
              {selectedPlazas.length > 1 && (
                <Typography variant="body2" color="text.secondary">
                  {selectedPlazas
                    .slice(0, 8)
                    .map((p) => p.codigo)
                    .join(', ')}
                  {selectedPlazas.length > 8 ? '…' : ''}
                </Typography>
              )}
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" onClick={() => toggleActivas(selectedPlazas, false)}>
                  Desactivar
                </Button>
                <Button size="small" onClick={() => toggleActivas(selectedPlazas, true)}>
                  Activar
                </Button>
                <Button size="small" color="error" onClick={() => eliminarPlazas(selectedPlazas)}>
                  Eliminar
                </Button>
                <Button size="small" onClick={() => setSelectedIds([])}>
                  Limpiar selección
                </Button>
              </Box>
            </Paper>
          )}

          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Piso {pisoActual}: {celdasForma.length} celdas de estructura · {plazasPiso.length} lugares
            {' · '}
            grilla {grid.cols}×{grid.rows}
          </Typography>
        </>
      )}

      <Dialog open={crearDialogOpen} onClose={() => !guardando && setCrearDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear piso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Elegí el tamaño de la grilla. Después no se puede cambiar (solo al crear).
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {GRID_PRESETS.map((p) => (
              <Chip
                key={p.id}
                label={`${p.label} · ${p.hint}`}
                color={crearPresetId === p.id ? 'primary' : 'default'}
                variant={crearPresetId === p.id ? 'filled' : 'outlined'}
                onClick={() => {
                  setNewCols(String(p.cols))
                  setNewRows(String(p.rows))
                }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Columnas"
              size="small"
              type="number"
              value={newCols}
              onChange={(e) => setNewCols(e.target.value)}
              inputProps={{ min: GRID_MIN, max: GRID_MAX_COLS }}
              sx={{ width: 120 }}
            />
            <TextField
              label="Filas"
              size="small"
              type="number"
              value={newRows}
              onChange={(e) => setNewRows(e.target.value)}
              inputProps={{ min: GRID_MIN, max: GRID_MAX_ROWS }}
              sx={{ width: 120 }}
            />
            <Typography variant="body2" color="text.secondary">
              {newCols}×{newRows}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCrearDialogOpen(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={confirmarCrearPiso} disabled={guardando}>
            {guardando ? 'Creando…' : `Crear piso ${newCols}×${newRows}`}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
