import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import AppLayout from '../components/AppLayout'
import ParkingMap from '../components/ParkingMap'
import MapaLeyenda from '../components/MapaLeyenda'
import IngresoDialog from '../components/IngresoDialog'
import api from '../api/client'
import { celdasDelPiso, derivePisosDesdePlazasYPlantas, pisosDesdePlantas } from '../utils/plantaForma'

function contarPorEstado(lista) {
  return {
    libres: lista.filter((p) => p.activa && !p.ocupada && !p.reservada).length,
    reservadas: lista.filter((p) => p.reservada && !p.ocupada).length,
    ocupadas: lista.filter((p) => p.ocupada).length,
    inactivas: lista.filter((p) => !p.activa).length,
  }
}

export default function MapaPage() {
  const [todasPlazas, setTodasPlazas] = useState([])
  const [plantas, setPlantas] = useState([])
  const [pisoActual, setPisoActual] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlaza, setSelectedPlaza] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const cargarPlazas = useCallback(async () => {
    setError('')
    try {
      const [resPlazas, resPlantas] = await Promise.all([
        api.get('/operador/plazas/estado'),
        api.get('/operador/plantas'),
      ])
      setTodasPlazas(resPlazas.data)
      setPlantas(resPlantas.data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las plazas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPlazas()
    const interval = setInterval(cargarPlazas, 15000)
    return () => clearInterval(interval)
  }, [cargarPlazas])

  const pisos = useMemo(() => {
    const guardados = pisosDesdePlantas(plantas)
    if (guardados.length) return guardados
    return derivePisosDesdePlazasYPlantas(todasPlazas, plantas)
  }, [todasPlazas, plantas])

  const celdasForma = useMemo(
    () => celdasDelPiso(plantas, pisoActual),
    [plantas, pisoActual],
  )

  const plazas = useMemo(
    () => todasPlazas.filter((p) => (p.piso || 1) === pisoActual),
    [todasPlazas, pisoActual],
  )

  useEffect(() => {
    if (pisos.length && !pisos.includes(pisoActual)) {
      setPisoActual(pisos[0])
    }
  }, [pisos, pisoActual])

  function handleSelectPlaza(plaza) {
    setSelectedPlaza(plaza)
    setDialogOpen(true)
  }

  function handleIngresoOk() {
    setSelectedPlaza(null)
    cargarPlazas()
  }

  const statsPiso = contarPorEstado(plazas)
  const statsEdificio = contarPorEstado(todasPlazas)

  return (
    <AppLayout maxWidth="xl">
      <Typography variant="h5" gutterBottom>
        Mapa de plazas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Navegá por piso con las pestañas. Clic en plaza libre o reservada para registrar ingreso.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Tabs
          value={pisoActual}
          onChange={(_, v) => setPisoActual(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {pisos.map((p) => {
            const delPiso = todasPlazas.filter((pl) => (pl.piso || 1) === p)
            const occ = delPiso.filter((pl) => pl.ocupada).length
            return (
              <Tab
                key={p}
                label={`Piso ${p}${delPiso.length ? ` (${occ}/${delPiso.length})` : ''}`}
                value={p}
              />
            )
          })}
        </Tabs>
        <Button size="small" variant="outlined" onClick={cargarPlazas}>
          Actualizar
        </Button>
      </Box>

      <MapaLeyenda
        piso={pisoActual}
        libres={statsPiso.libres}
        reservadas={statsPiso.reservadas}
        ocupadas={statsPiso.ocupadas}
        inactivas={statsPiso.inactivas}
        totalEdificio={todasPlazas.length}
      />

      <Paper sx={{ p: 2, display: 'inline-block', overflow: 'auto' }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>
          Vista del piso {pisoActual}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minWidth: 320 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ParkingMap
            plazas={plazas}
            piso={pisoActual}
            celdasForma={celdasForma}
            selectedId={selectedPlaza?.id}
            onSelectPlaza={handleSelectPlaza}
          />
        )}
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Edificio completo: {statsEdificio.libres} libres · {statsEdificio.reservadas} reservadas ·{' '}
          {statsEdificio.ocupadas} ocupadas · {pisos.length} piso(s)
        </Typography>
      </Box>

      <IngresoDialog
        open={dialogOpen}
        plaza={selectedPlaza}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleIngresoOk}
      />
    </AppLayout>
  )
}
