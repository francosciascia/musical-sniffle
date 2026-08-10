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
    reservadas: lista.filter((p) => p.activa && p.reservada && !p.ocupada).length,
    ocupadas: lista.filter((p) => p.activa && p.ocupada).length,
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
  const [avisos, setAvisos] = useState([])

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

  const plantaActual = useMemo(
    () => plantas.find((p) => p.piso === pisoActual),
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
    if (plaza?.reservada && !plaza?.ocupada) {
      setAvisos([
        `Plaza ${plaza.codigo} es de abonado${plaza.reservaCliente ? ` (${plaza.reservaCliente})` : ''}. No requiere ingreso ni ticket.`,
      ])
      setSelectedPlaza(plaza)
      return
    }
    setSelectedPlaza(plaza || null)
    setDialogOpen(true)
  }

  function handleIngresoOk(estadia) {
    setSelectedPlaza(null)
    cargarPlazas()
    setAvisos(Array.isArray(estadia?.avisos) ? estadia.avisos : [])
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
          overflow: 'hidden',
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
            gap: 1.5,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ flexShrink: 0 }}>
            Plano
          </Typography>
          <Tabs
            value={pisoActual}
            onChange={(_, v) => {
              setPisoActual(v)
              setSelectedPlaza(null)
            }}
            variant="standard"
            sx={{
              minHeight: 36,
              minWidth: 0,
              flex: 1,
              '& .MuiTabs-flexContainer': { flexWrap: 'wrap', gap: 0.25 },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            {pisos.map((p) => {
              const delPiso = todasPlazas.filter((pl) => (pl.piso || 1) === p)
              const occ = delPiso.filter((pl) => pl.ocupada).length
              const res = delPiso.filter((pl) => pl.reservada && !pl.ocupada).length
              return (
                <Tab
                  key={p}
                  label={
                    delPiso.length
                      ? `Piso ${p} · ${occ + res}/${delPiso.length}`
                      : `Piso ${p}`
                  }
                  value={p}
                  sx={{ minHeight: 36, minWidth: 0, px: 1.25, py: 0.5 }}
                />
              )
            })}
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 1.5, flexShrink: 0 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {avisos.length > 0 && (
          <Alert severity="warning" sx={{ m: 1.5, flexShrink: 0 }} onClose={() => setAvisos([])}>
            {avisos.map((a) => (
              <Typography key={a} variant="body2">
                {a}
              </Typography>
            ))}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
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
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                bgcolor: colors.surface,
                overflow: 'hidden',
              }}
            >
              <ParkingMap
                plazas={plazas}
                piso={pisoActual}
                celdasForma={celdasForma}
                gridCols={plantaActual?.gridCols}
                gridRows={plantaActual?.gridRows}
                selectedId={selectedPlaza?.id}
                onSelectPlaza={handleSelectPlaza}
                fit
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
