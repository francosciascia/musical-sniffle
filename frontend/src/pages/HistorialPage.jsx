import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Download } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import api from '../api/client'
import { getRol, isAdmin } from '../utils/auth'
import { downloadCsv } from '../utils/exportCsv'
import { labelMedioPago } from '../utils/mediosPago'

export default function HistorialPage() {
  const rol = getRol()
  const admin = isAdmin(rol)
  const [eventos, setEventos] = useState([])
  const [totales, setTotales] = useState(null)
  const [error, setError] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargar = useCallback(async () => {
    setError('')
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta

    try {
      const url = admin ? '/admin/historial' : '/operador/historial'
      const { data } = await api.get(url, { params })
      setEventos(data)

      if (admin) {
        const resTotal = await api.get('/admin/historial/total', { params })
        setTotales(resTotal.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el historial')
    }
  }, [admin, desde, hasta])

  useEffect(() => {
    cargar()
  }, [cargar])

  function exportHistorial() {
    downloadCsv(
      `historial_${desde || 'inicio'}_${hasta || 'hoy'}.csv`,
      ['Fecha', 'Evento', 'Descripcion', 'Usuario', 'Monto', 'MedioPago'],
      eventos.map((e) => [
        e.fechaHora?.replace('T', ' ').slice(0, 19) || '',
        e.tipoEvento,
        e.descripcion,
        e.personaEmail || '',
        e.monto ?? '',
        e.medioPago || '',
      ]),
    )
  }

  function exportCaja() {
    const pagos = eventos.filter((e) => e.tipoEvento === 'PAGO' || e.tipoEvento === 'PAGO_MENSUAL')
    downloadCsv(
      `caja_${desde || 'inicio'}_${hasta || 'hoy'}.csv`,
      ['Fecha', 'Tipo', 'Descripcion', 'Usuario', 'Monto', 'MedioPago'],
      pagos.map((e) => [
        e.fechaHora?.replace('T', ' ').slice(0, 19) || '',
        e.tipoEvento,
        e.descripcion,
        e.personaEmail || '',
        e.monto ?? '',
        labelMedioPago(e.medioPago),
      ]),
    )
  }

  return (
    <AppLayout maxWidth="xl">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Historial de eventos
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportHistorial}
            disabled={!eventos.length}
          >
            CSV historial
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportCaja}
            disabled={!eventos.some((e) => e.tipoEvento === 'PAGO' || e.tipoEvento === 'PAGO_MENSUAL')}
          >
            CSV caja
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Desde"
          type="date"
          size="small"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Hasta"
          type="date"
          size="small"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="outlined" onClick={cargar}>
          Filtrar
        </Button>
      </Box>

      {admin && totales && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2">
            Totales del período: Pagos ${totales.totalPagos} · Mensuales ${totales.totalPagosMensuales} ·
            General ${totales.totalGeneral}
          </Typography>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Medio</TableCell>
              <TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Sin eventos en el período
                </TableCell>
              </TableRow>
            )}
            {eventos.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.fechaHora?.replace('T', ' ').slice(0, 16)}</TableCell>
                <TableCell>{e.tipoEvento}</TableCell>
                <TableCell>{e.descripcion}</TableCell>
                <TableCell>{e.personaEmail || '—'}</TableCell>
                <TableCell>{labelMedioPago(e.medioPago)}</TableCell>
                <TableCell align="right">{e.monto != null ? `$${e.monto}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AppLayout>
  )
}
