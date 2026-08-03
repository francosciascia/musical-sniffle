import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import MapGridEditor, { HERRAMIENTA_PLAZAS } from '../components/MapGridEditor'
import api from '../api/client'
import { nextPlazaCodigos } from '../utils/plazaLayout'
import {
  applyPaint,
  celdasDelPiso,
  pisosDesdePlantas,
  TIPO_CELDA,
} from '../utils/plantaForma'

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
  const [mostrarContorno, setMostrarContorno] = useState(false)
  const [herramienta, setHerramienta] = useState(TIPO_CELDA.FORMA)
  const [herramientaPlazas, setHerramientaPlazas] = useState(HERRAMIENTA_PLAZAS.CREAR)

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
  }, [pisoActual, herramientaPlazas])

  const celdasForma = useMemo(
    () => (pisoActual != null ? celdasDelPiso(plantas, pisoActual) : []),
    [plantas, pisoActual],
  )

  const plazasPiso = useMemo(
    () => (pisoActual != null ? plazas.filter((p) => p.piso === pisoActual) : []),
    [plazas, pisoActual],
  )

  const selectedPlazas = useMemo(
    () => plazasPiso.filter((p) => selectedIds.includes(p.id)),
    [plazasPiso, selectedIds],
  )

  const pisoGuardado = pisoActual != null && plantas.some((p) => p.piso === pisoActual)

  async function crearYGuardarPiso() {
    setGuardando(true)
    setError('')
    setOk('')
    try {
      const { data } = await api.post('/admin/plantas')
      setPlantas((prev) => [...prev, data].sort((a, b) => a.piso - b.piso))
      setPisoActual(data.piso)
      setOk(`Piso ${data.piso} creado y guardado`)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el piso')
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

  async function guardarContorno(celdas) {
    if (pisoActual == null) return
    setGuardando(true)
    try {
      const { data } = await api.put(`/admin/plantas/${pisoActual}`, { celdas })
      setPlantas((prev) => {
        const rest = prev.filter((p) => p.piso !== pisoActual)
        return [...rest, data].sort((a, b) => a.piso - b.piso)
      })
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el contorno')
    } finally {
      setGuardando(false)
    }
  }

  async function pintarContorno(cells, tool) {
    const nuevas = applyPaint(celdasForma, cells, tool)
    await guardarContorno(nuevas)
  }

  async function crearPlazasEnCeldas(celdas) {
    if (!celdas.length || creando || pisoActual == null) return

    if (!pisoGuardado) {
      setError('Primero creá y guardá un piso con el botón "Crear piso".')
      return
    }

    setCreando(true)
    setError('')
    setOk('')
    setSelectedIds([])

    const codigos = nextPlazaCodigos(plazas, celdas.length)

    try {
      for (let i = 0; i < celdas.length; i++) {
        await api.post('/admin/plazas', {
          codigo: codigos[i],
          activa: true,
          piso: pisoActual,
          posX: celdas[i].col,
          posY: celdas[i].row,
        })
      }

      const preview =
        celdas.length <= 5
          ? codigos.join(', ')
          : `${codigos.slice(0, 3).join(', ')}… (+${celdas.length - 3} más)`

      setOk(`${celdas.length} lugar(es) en piso ${pisoActual}: ${preview}`)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron crear los lugares')
      await cargar()
    } finally {
      setCreando(false)
    }
  }

  async function moverPlaza(plaza, col, row) {
    try {
      await api.put(`/admin/plazas/${plaza.id}`, {
        codigo: plaza.codigo,
        activa: plaza.activa,
        piso: pisoActual,
        posX: col,
        posY: row,
      })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo mover el lugar')
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
      lista.length === 1
        ? `¿Eliminar ${lista[0].codigo}?`
        : `¿Eliminar ${lista.length} lugares seleccionados?`
    if (!window.confirm(msg)) return

    setError('')
    setOk('')
    let okCount = 0
    let failCount = 0
    for (const plaza of lista) {
      try {
        await api.delete(`/admin/plazas/${plaza.id}`)
        okCount++
      } catch {
        failCount++
      }
    }
    setSelectedIds([])
    if (okCount) setOk(`${okCount} lugar(es) eliminado(s)`)
    if (failCount) setError(`${failCount} no se pudieron eliminar (¿ocupadas?)`)
    await cargar()
  }

  async function toggleActivas(lista, activa) {
    if (!lista?.length) return
    setError('')
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

  const modoEditor = mostrarContorno ? 'forma' : 'plazas'

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
        <Button
          size="small"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/config')}
        >
          Volver a configuración
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        1) Creá un piso · 2) Elegí herramienta · 3) Arrastrá sobre la grilla para crear, seleccionar
        o borrar varios lugares a la vez.
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
            return (
              <Chip
                key={p}
                label={`Piso ${p}${count ? ` · ${count} lugares` : ''}`}
                color={pisoActual === p ? 'primary' : 'default'}
                onClick={() => setPisoActual(p)}
                onDelete={() => eliminarPiso(p)}
              />
            )
          })}
          <Button
            variant="contained"
            size="small"
            onClick={crearYGuardarPiso}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : '+ Crear piso'}
          </Button>
        </Box>
      </Paper>

      {pisoActual != null && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Tabs value={pisoActual} onChange={(_, v) => setPisoActual(v)}>
              {pisos.map((p) => (
                <Tab key={p} label={`Editar piso ${p}`} value={p} />
              ))}
            </Tabs>
            {(creando || guardando) && <CircularProgress size={22} />}
          </Box>

          {!mostrarContorno && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Herramienta de plazas
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
                Arrastrá un rectángulo sobre varios cuadros. En Seleccionar también podés usar
                Shift/Ctrl + clic.
              </Typography>
            </Box>
          )}

          <Button size="small" sx={{ mb: 1 }} onClick={() => setMostrarContorno((v) => !v)}>
            {mostrarContorno ? 'Ocultar contorno opcional' : 'Opcional: dibujar contorno del piso'}
          </Button>

          <Collapse in={mostrarContorno}>
            <Box sx={{ mb: 2 }}>
              <ToggleButtonGroup
                value={herramienta}
                exclusive
                onChange={(_, v) => v && setHerramienta(v)}
                size="small"
              >
                <ToggleButton value={TIPO_CELDA.FORMA}>Área del piso</ToggleButton>
                <ToggleButton value={TIPO_CELDA.OBSTACULO}>Obstáculo</ToggleButton>
                <ToggleButton value="BORRAR">Borrar</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Si dibujás contorno, los lugares solo se podrán poner en el área gris.
              </Typography>
            </Box>
          </Collapse>

          <Paper sx={{ p: 2, display: 'inline-block', overflow: 'auto' }}>
            <MapGridEditor
              mode={modoEditor}
              herramienta={herramienta}
              herramientaPlazas={herramientaPlazas}
              celdasForma={celdasForma}
              plazas={plazas}
              piso={pisoActual}
              pisoGuardado={pisoGuardado}
              selectedIds={selectedIds}
              onFormaPaint={pintarContorno}
              onCellsSelect={crearPlazasEnCeldas}
              onPlazaMove={moverPlaza}
              onSelectPlaza={handleSelectPlaza}
              onSelectPlazas={handleSelectPlazas}
              onDeletePlazas={eliminarPlazas}
            />
          </Paper>

          {!mostrarContorno && selectedPlazas.length > 0 && (
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
                <Button
                  size="small"
                  color="error"
                  onClick={() => eliminarPlazas(selectedPlazas)}
                >
                  Eliminar
                </Button>
                <Button size="small" onClick={() => setSelectedIds([])}>
                  Limpiar selección
                </Button>
              </Box>
            </Paper>
          )}

          <Typography variant="body2" sx={{ mt: 2 }}>
            Piso {pisoActual}: {plazasPiso.length} lugares dibujados
          </Typography>
        </>
      )}
    </AppLayout>
  )
}
