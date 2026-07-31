import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

export default function EstadiasPage() {
  const [estadias, setEstadias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState('patente')
  const [resultado, setResultado] = useState(null)
  const [cobro, setCobro] = useState(null)
  const [cerrando, setCerrando] = useState(false)

  const cargar = useCallback(async () => {
    setError('')
    try {
      const { data } = await api.get('/operador/estadias/activas')
      setEstadias(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las estadías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function buscar() {
    setError('')
    setResultado(null)
    const param = tipoBusqueda === 'patente' ? { patente: busqueda } : { ticket: busqueda }
    try {
      const { data } = await api.get('/operador/estadias/buscar', { params: param })
      setResultado(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró estadía activa')
    }
  }

  async function cerrarEstadia(id) {
    setCerrando(true)
    setError('')
    try {
      const { data } = await api.post(`/estadias/${id}/cerrar`)
      setCobro(data)
      setResultado(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cerrar la estadía')
    } finally {
      setCerrando(false)
    }
  }

  return (
    <AppLayout>
      <Typography variant="h5" gutterBottom>
        Estadías activas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Buscar para registrar salida
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            label="Buscar por"
            value={tipoBusqueda}
            onChange={(e) => setTipoBusqueda(e.target.value)}
            SelectProps={{ native: true }}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <option value="patente">Patente</option>
            <option value="ticket">Ticket</option>
          </TextField>
          <TextField
            label={tipoBusqueda === 'patente' ? 'Patente' : 'Código ticket'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
            size="small"
          />
          <Button variant="outlined" onClick={buscar}>
            Buscar
          </Button>
        </Box>

        {resultado && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography>
              <strong>{resultado.patente}</strong> — Plaza {resultado.plazaCodigo || '—'}
              {resultado.abonado && ' (abonado)'}
            </Typography>
            <Typography variant="body2">
              Ticket: {resultado.ticket?.codigo}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 1 }}
              disabled={cerrando}
              onClick={() => cerrarEstadia(resultado.id)}
            >
              {cerrando ? 'Procesando...' : 'Registrar salida y cobrar'}
            </Button>
          </Box>
        )}
      </Paper>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patente</TableCell>
                <TableCell>Plaza</TableCell>
                <TableCell>Ticket</TableCell>
                <TableCell>Abonado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {estadias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay vehículos estacionados
                  </TableCell>
                </TableRow>
              )}
              {estadias.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.patente}</TableCell>
                  <TableCell>{e.plazaCodigo || '—'}</TableCell>
                  <TableCell>{e.ticket?.codigo}</TableCell>
                  <TableCell>{e.abonado ? 'Sí' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => cerrarEstadia(e.id)} disabled={cerrando}>
                      Salida
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!cobro} onClose={() => setCobro(null)}>
        <DialogTitle>Salida registrada</DialogTitle>
        <DialogContent>
          <Typography>Patente: {cobro?.patente}</Typography>
          <Typography>Tipo: {cobro?.tipoVehiculo}</Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            Monto: ${cobro?.monto}
            {cobro?.abonado && ' (abonado — $0)'}
          </Typography>
          <Typography variant="body2">Ticket: {cobro?.ticketCodigo}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCobro(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
