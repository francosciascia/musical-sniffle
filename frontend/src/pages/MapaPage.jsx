import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Box, CircularProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import AppLayout from '../components/AppLayout'
import ParkingMap from '../components/ParkingMap'
import OpsSidePanel from '../components/OpsSidePanel'
import IngresoDialog from '../components/IngresoDialog'
import TicketPreviewDialog from '../components/TicketPreviewDialog'
import api from '../api/client'
import { colors } from '../theme/colors'
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
  const [ticket, setTicket] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)

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
  }

  function abrirIngreso(plaza) {
    setSelectedPlaza(plaza || null)
    setDialogOpen(true)
  }

  function handleIngresoOk(estadia) {
    setSelectedPlaza(null)
    cargarPlazas()
    if (estadia?.ticket) {
      setTicket(estadia.ticket)
      setTicketOpen(true)
    }
  }

  const statsPiso = contarPorEstado(plazas)
  const statsEdificio = contarPorEstado(todasPlazas)

  return (
    <AppLayout variant="ops">
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: { xs: '42dvh', md: 0 },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: colors.surfaceAlt,
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            px: 1.5,
            py: 0.75,
            borderBottom: `1px solid ${colors.border}`,
            bgcolor: colors.surface,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Plano
          </Typography>
          <Tabs
            value={pisoActual}
            onChange={(_, v) => {
              setPisoActual(v)
              setSelectedPlaza(null)
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {pisos.map((p) => {
              const delPiso = todasPlazas.filter((pl) => (pl.piso || 1) === p)
              const occ = delPiso.filter((pl) => pl.ocupada).length
              return (
                <Tab
                  key={p}
                  label={
                    delPiso.length
                      ? `Piso ${p} · ${occ}/${delPiso.length}`
                      : `Piso ${p}`
                  }
                  value={p}
                />
              )
            })}
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            p: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <Stack alignItems="center" spacing={1} sx={{ mt: 8 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Cargando plano…
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                bgcolor: colors.surface,
                p: 1,
                lineHeight: 0,
              }}
            >
              <ParkingMap
                plazas={plazas}
                piso={pisoActual}
                celdasForma={celdasForma}
                selectedId={selectedPlaza?.id}
                onSelectPlaza={handleSelectPlaza}
              />
            </Box>
          )}
        </Box>
      </Box>

      <OpsSidePanel
        piso={pisoActual}
        stats={statsPiso}
        statsEdificio={statsEdificio}
        selectedPlaza={selectedPlaza}
        onRefresh={cargarPlazas}
        onIngresoPlaza={abrirIngreso}
        onEgresoOk={cargarPlazas}
      />

      <IngresoDialog
        open={dialogOpen}
        plaza={selectedPlaza}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleIngresoOk}
      />

      <TicketPreviewDialog
        open={ticketOpen}
        ticket={ticket}
        onClose={() => setTicketOpen(false)}
      />
    </AppLayout>
  )
}
