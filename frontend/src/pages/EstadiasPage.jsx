import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowUpFromLine, Search } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import api from '../api/client'
import { colors } from '../theme/colors'

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

      <Box
        sx={{
          p: 1.5,
          mb: 2,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          bgcolor: colors.surfaceAlt,
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Buscar para egreso
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
          <TextField
            select
            label="Buscar por"
            value={tipoBusqueda}
            onChange={(e) => setTipoBusqueda(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="patente">Patente</MenuItem>
            <MenuItem value="ticket">Ticket</MenuItem>
          </TextField>
          <TextField
            label={tipoBusqueda === 'patente' ? 'Patente' : 'Código ticket'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
            inputProps={{ className: 'mono' }}
          />
          <Button variant="contained" onClick={buscar} startIcon={<Search size={16} />}>
            Buscar
          </Button>
        </Stack>

        {resultado && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.25,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              bgcolor: colors.surface,
            }}
          >
            <Typography className="mono" sx={{ fontWeight: 700 }}>
              {resultado.patente}
            </Typography>
            <Typography variant="body2">
              Plaza {resultado.plazaCodigo || '—'}
              {resultado.abonado ? ' · Abonado' : ''}
            </Typography>
            <Typography variant="caption" className="mono" color="text.secondary">
              Ticket {resultado.ticket?.codigo}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 1 }}
              disabled={cerrando}
              startIcon={<ArrowUpFromLine size={16} />}
              onClick={() => cerrarEstadia(resultado.id)}
            >
              {cerrando ? 'Procesando…' : 'Registrar egreso'}
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: '6px', overflow: 'hidden' }}>
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
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Cargando…
                </TableCell>
              </TableRow>
            )}
            {!loading && estadias.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay vehículos estacionados
                </TableCell>
              </TableRow>
            )}
            {estadias.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <span className="mono">{e.patente}</span>
                </TableCell>
                <TableCell>{e.plazaCodigo || '—'}</TableCell>
                <TableCell>
                  <span className="mono">{e.ticket?.codigo}</span>
                </TableCell>
                <TableCell>{e.abonado ? 'Sí' : 'No'}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="secondary"
                    variant="contained"
                    disabled={cerrando}
                    startIcon={<ArrowUpFromLine size={14} />}
                    onClick={() => cerrarEstadia(e.id)}
                  >
                    Egreso
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={!!cobro} onClose={() => setCobro(null)}>
        <DialogTitle>Egreso registrado</DialogTitle>
        <DialogContent>
          <Typography className="mono" sx={{ fontWeight: 700 }}>
            {cobro?.patente}
          </Typography>
          <Typography variant="body2">Tipo: {cobro?.tipoVehiculo}</Typography>
          <Typography sx={{ mt: 1, fontWeight: 700 }}>
            Monto: ${cobro?.monto}
            {cobro?.abonado ? ' (abonado)' : ''}
          </Typography>
          <Typography variant="caption" className="mono" color="text.secondary">
            Ticket {cobro?.ticketCodigo}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCobro(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
