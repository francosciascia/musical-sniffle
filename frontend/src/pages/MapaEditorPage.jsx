import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import AppLayout from '../components/AppLayout'
import MapGridEditor from '../components/MapGridEditor'
import api from '../api/client'
import { nextPlazaCodigos } from '../utils/plazaLayout'
import {
  applyPaint,
  celdasDelPiso,
  pisosDesdePlantas,
  TIPO_CELDA,
} from '../utils/plantaForma'

export default function MapaEditorPage() {
  const [plazas, setPlazas] = useState([])
  const [plantas, setPlantas] = useState([])
  const [pisoActual, setPisoActual] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [creando, setCreando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mostrarContorno, setMostrarContorno] = useState(false)
  const [herramienta, setHerramienta] = useState(TIPO_CELDA.FORMA)

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

  const celdasForma = useMemo(
    () => (pisoActual != null ? celdasDelPiso(plantas, pisoActual) : []),
    [plantas, pisoActual],
  )

  const plazasPiso = useMemo(
    () => (pisoActual != null ? plazas.filter((p) => p.piso === pisoActual) : []),
    [plazas, pisoActual],
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
    setSelected(null)

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

  async function eliminarPlaza(id) {
    if (!window.confirm('¿Eliminar este lugar?')) return
    setError('')
    try {
      await api.delete(`/admin/plazas/${id}`)
      setSelected(null)
      setOk('Lugar eliminado')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar')
    }
  }

  async function toggleActiva(plaza) {
    try {
      await api.put(`/admin/plazas/${plaza.id}`, {
        codigo: plaza.codigo,
        activa: !plaza.activa,
        piso: plaza.piso,
        posX: plaza.posX,
        posY: plaza.posY,
      })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar')
    }
  }

  const modoEditor = mostrarContorno ? 'forma' : 'plazas'

  return (
    <AppLayout maxWidth="xl">
      <Typography variant="h5" gutterBottom>
        Diseñar estacionamiento
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        1) Creá y guardá cada piso · 2) Elegí un piso · 3) Arrastrá en la grilla para dibujar los
        lugares (plazas).
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk('')}>{ok}</Alert>}

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

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Piso {pisoActual}:</strong> arrastrá sobre la grilla para agregar lugares. Los
            nombres se generan solos (P-01, P-02…).
          </Typography>

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
              celdasForma={celdasForma}
              plazas={plazas}
              piso={pisoActual}
              pisoGuardado={pisoGuardado}
              selectedId={selected?.id}
              onFormaPaint={pintarContorno}
              onCellsSelect={crearPlazasEnCeldas}
              onPlazaMove={moverPlaza}
              onSelectPlaza={setSelected}
            />
          </Paper>

          {!mostrarContorno && selected && (
            <Paper sx={{ p: 2, mt: 2, maxWidth: 400 }}>
              <Typography variant="subtitle1">{selected.codigo}</Typography>
              <Typography variant="body2">
                Celda ({selected.posX}, {selected.posY}) — Piso {selected.piso}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => toggleActiva(selected)}>
                  {selected.activa ? 'Desactivar' : 'Activar'}
                </Button>
                <Button size="small" color="error" onClick={() => eliminarPlaza(selected.id)}>
                  Eliminar
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
