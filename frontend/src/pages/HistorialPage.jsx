import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AppLayout from '../components/AppLayout'
import api from '../api/client'
import { getRol, isAdmin } from '../utils/auth'

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

  return (
    <AppLayout maxWidth="xl">
      <Typography variant="h5" gutterBottom>
        Historial de eventos
      </Typography>

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
            Totales del período: Pagos ${totales.totalPagos} · Mensuales ${totales.totalPagosMensuales} · General ${totales.totalGeneral}
          </Typography>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
                <TableCell align="right">{e.monto != null ? `$${e.monto}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AppLayout>
  )
}
