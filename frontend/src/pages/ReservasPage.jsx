import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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

const ESTADOS = ['ACTIVA', 'SUSPENDIDA', 'VENCIDA', 'CANCELADA']

function estadoColor(estado) {
  if (estado === 'ACTIVA') return 'success'
  if (estado === 'CANCELADA' || estado === 'VENCIDA') return 'default'
  return 'warning'
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState([])
  const [clientes, setClientes] = useState([])
  const [plazas, setPlazas] = useState([])
  const [autos, setAutos] = useState([])
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    clienteId: '',
    plazaId: '',
    autoIds: [],
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: '',
    montoMensual: '',
    estado: 'ACTIVA',
  })

  const cargar = useCallback(async () => {
    try {
      const [resReservas, resUsuarios, resPlazas, resAutos] = await Promise.all([
        api.get('/admin/reservas'),
        api.get('/admin/usuarios'),
        api.get('/admin/plazas'),
        api.get('/autos'),
      ])
      setReservas(resReservas.data)
      setClientes(resUsuarios.data.filter((u) => u.rol === 'CLIENTE'))
      setPlazas(resPlazas.data.filter((p) => p.activa))
      setAutos(resAutos.data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los datos')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const autosCliente = form.clienteId
    ? autos.filter((a) => a.cliente?.id === Number(form.clienteId))
    : []

  async function crearReserva() {
    setLoading(true)
    setError('')
    try {
      await api.post('/admin/reservas', {
        clienteId: Number(form.clienteId),
        plazaId: Number(form.plazaId),
        autoIds: form.autoIds.map(Number),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin || null,
        montoMensual: Number(form.montoMensual),
        estado: form.estado,
      })
      setDialogOpen(false)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  async function cancelar(id) {
    if (!window.confirm('¿Cancelar esta reserva?')) return
    try {
      await api.post(`/admin/reservas/${id}/cancelar`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cancelar')
    }
  }

  async function pagoMensual(id) {
    try {
      await api.post(`/admin/reservas/${id}/pago-mensual`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el pago')
    }
  }

  return (
    <AppLayout maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Reservas mensuales</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Nueva reserva
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Plaza</TableCell>
              <TableCell>Patentes</TableCell>
              <TableCell>Desde</TableCell>
              <TableCell>Hasta</TableCell>
              <TableCell>$/mes</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservas.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.clienteNombre}</TableCell>
                <TableCell>{r.plazaCodigo}</TableCell>
                <TableCell>{r.patentes?.join(', ')}</TableCell>
                <TableCell>{r.fechaInicio}</TableCell>
                <TableCell>{r.fechaFin || '—'}</TableCell>
                <TableCell>${r.montoMensual}</TableCell>
                <TableCell>
                  <Chip label={r.estado} color={estadoColor(r.estado)} size="small" />
                </TableCell>
                <TableCell align="right">
                  {r.estado === 'ACTIVA' && (
                    <>
                      <Button size="small" onClick={() => pagoMensual(r.id)}>
                        Pago mensual
                      </Button>
                      <Button size="small" color="error" onClick={() => cancelar(r.id)}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva reserva mensual</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Cliente"
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value, autoIds: [] })}
          >
            {clientes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre} {c.apellido} ({c.email})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Plaza"
            value={form.plazaId}
            onChange={(e) => setForm({ ...form, plazaId: e.target.value })}
          >
            {plazas.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.codigo}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Autos del cliente"
            value={form.autoIds}
            onChange={(e) =>
              setForm({
                ...form,
                autoIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
              })
            }
            SelectProps={{ multiple: true }}
            helperText={
              autosCliente.length === 0
                ? 'El cliente no tiene autos registrados'
                : 'Seleccioná uno o más'
            }
          >
            {autosCliente.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.patente} ({a.tipo})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Fecha inicio"
            type="date"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fecha fin (opcional)"
            type="date"
            value={form.fechaFin}
            onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Monto mensual"
            type="number"
            value={form.montoMensual}
            onChange={(e) => setForm({ ...form, montoMensual: e.target.value })}
          />
          <TextField
            select
            label="Estado"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          >
            {ESTADOS.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={crearReserva} disabled={loading}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
