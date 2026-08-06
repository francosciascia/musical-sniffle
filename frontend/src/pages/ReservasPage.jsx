import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { MapPin } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PlazaMapPickerDialog from '../components/PlazaMapPickerDialog'
import TablePager from '../components/TablePager'
import api from '../api/client'
import { usePagedRows } from '../hooks/usePagedRows'

const ESTADOS = ['ACTIVA', 'SUSPENDIDA', 'VENCIDA', 'CANCELADA']

/** Precios redondos rápidos además de los de tarifa (lugar / promociones). */
const MONTOS_SUGERIDOS_EXTRA = [40000, 45000, 48000, 50000, 55000, 60000]

function estadoColor(estado) {
  if (estado === 'ACTIVA') return 'success'
  if (estado === 'CANCELADA' || estado === 'VENCIDA') return 'default'
  return 'warning'
}

function formatMoney(n) {
  if (n == null || n === '') return '—'
  return `$${Number(n).toLocaleString('es-AR')}`
}

const formVacio = () => ({
  clienteId: '',
  plazaId: '',
  autoIds: [],
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
  montoMensual: '',
  estado: 'ACTIVA',
})

export default function ReservasPage() {
  const [reservas, setReservas] = useState([])
  const [clientes, setClientes] = useState([])
  const [plazas, setPlazas] = useState([])
  const [autos, setAutos] = useState([])
  const [tarifas, setTarifas] = useState([])
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(formVacio)
  const { page, rowsPerPage, setPage, setRowsPerPage, paged, count } = usePagedRows(reservas)

  const cargar = useCallback(async () => {
    try {
      const [resReservas, resUsuarios, resPlazas, resAutos, resTarifas] = await Promise.all([
        api.get('/admin/reservas'),
        api.get('/admin/usuarios'),
        api.get('/admin/plazas'),
        api.get('/autos'),
        api.get('/admin/tarifas'),
      ])
      setReservas(resReservas.data)
      setClientes(resUsuarios.data.filter((u) => u.rol === 'CLIENTE'))
      setPlazas(resPlazas.data.filter((p) => p.activa))
      setAutos(resAutos.data)
      setTarifas(resTarifas.data)
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

  const plazaSeleccionada = plazas.find((p) => String(p.id) === String(form.plazaId))

  const precioPorTipo = useMemo(() => {
    const map = {}
    for (const t of tarifas) {
      if (t.activa && t.precioMensual != null) {
        map[t.tipoVehiculo] = Number(t.precioMensual)
      }
    }
    return map
  }, [tarifas])

  /** Si hay varios vehículos, se sugiere el abono del tipo más caro. */
  const montoSugeridoAutos = useMemo(() => {
    if (!form.autoIds?.length) return null
    let max = 0
    let tipoMax = null
    for (const id of form.autoIds) {
      const auto = autosCliente.find((a) => String(a.id) === String(id))
      if (!auto) continue
      const precio = precioPorTipo[auto.tipo]
      if (precio != null && precio > max) {
        max = precio
        tipoMax = auto.tipo
      }
    }
    return max > 0 ? { monto: max, tipo: tipoMax } : null
  }, [form.autoIds, autosCliente, precioPorTipo])

  const chipsMonto = useMemo(() => {
    const set = new Set()
    if (montoSugeridoAutos) set.add(montoSugeridoAutos.monto)
    Object.values(precioPorTipo).forEach((v) => set.add(v))
    MONTOS_SUGERIDOS_EXTRA.forEach((v) => set.add(v))
    return [...set].sort((a, b) => a - b)
  }, [montoSugeridoAutos, precioPorTipo])

  function setAutoIds(autoIds) {
    const next = { ...form, autoIds }
    // Autocompletar monto con el más alto de los seleccionados
    let max = 0
    for (const id of autoIds) {
      const auto = autos.filter((a) => a.cliente?.id === Number(form.clienteId)).find((a) => String(a.id) === String(id))
      if (!auto) continue
      const precio = precioPorTipo[auto.tipo]
      if (precio != null && precio > max) max = precio
    }
    if (max > 0) next.montoMensual = String(max)
    setForm(next)
  }

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
      setForm(formVacio())
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Reservas mensuales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Elegí un cliente de la lista (crealos en Clientes si falta).
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Nueva reserva
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 720 }}>
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
            {count === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay reservas
                </TableCell>
              </TableRow>
            )}
            {paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.clienteNombre}</TableCell>
                <TableCell>{r.plazaCodigo}</TableCell>
                <TableCell>{r.patentes?.join(', ')}</TableCell>
                <TableCell>{r.fechaInicio}</TableCell>
                <TableCell>{r.fechaFin || '—'}</TableCell>
                <TableCell>{formatMoney(r.montoMensual)}</TableCell>
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
        <TablePager
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva reserva mensual</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              select
              label="Cliente"
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value, autoIds: [] })}
              fullWidth
              helperText={
                clientes.length === 0 ? 'No hay clientes — crealos en el menú Clientes' : undefined
              }
            >
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} ({c.email})
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
              <TextField
                select
                label="Plaza"
                value={form.plazaId}
                onChange={(e) => setForm({ ...form, plazaId: e.target.value })}
                fullWidth
                helperText={plazaSeleccionada ? `Código ${plazaSeleccionada.codigo}` : 'Lista o mapa'}
              >
                {plazas.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.codigo}
                    {p.piso != null ? ` · Piso ${p.piso}` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<MapPin size={16} />}
                onClick={() => setMapOpen(true)}
                sx={{ flexShrink: 0, mt: { sm: 0.5 }, whiteSpace: 'nowrap' }}
              >
                Elegir en mapa
              </Button>
            </Stack>

            <TextField
              select
              label="Autos del cliente"
              value={form.autoIds}
              onChange={(e) =>
                setAutoIds(
                  typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                )
              }
              SelectProps={{ multiple: true }}
              fullWidth
              helperText={
                autosCliente.length === 0
                  ? 'El cliente no tiene autos registrados'
                  : 'Si elegís varios, el abono sugerido es el del tipo más caro'
              }
            >
              {autosCliente.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.patente} ({a.tipo}
                  {precioPorTipo[a.tipo] != null
                    ? ` · ${formatMoney(precioPorTipo[a.tipo])}/mes`
                    : ''}
                  )
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Fecha de inicio"
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Fecha de fin"
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Opcional — vacío = indefinida"
              />
            </Stack>

            <Box>
              <TextField
                label="Monto mensual"
                type="number"
                value={form.montoMensual}
                onChange={(e) => setForm({ ...form, montoMensual: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText={
                  montoSugeridoAutos
                    ? `Sugerido por vehículos: ${formatMoney(montoSugeridoAutos.monto)} (${montoSugeridoAutos.tipo})`
                    : 'Elegí un monto redondo o tocá una sugerencia'
                }
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                {chipsMonto.map((m) => (
                  <Chip
                    key={m}
                    size="small"
                    label={formatMoney(m)}
                    color={String(form.montoMensual) === String(m) ? 'primary' : 'default'}
                    variant={String(form.montoMensual) === String(m) ? 'filled' : 'outlined'}
                    onClick={() => setForm({ ...form, montoMensual: String(m) })}
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              select
              label="Estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              fullWidth
            >
              {ESTADOS.map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={crearReserva} disabled={loading}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      <PlazaMapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        selectedId={form.plazaId ? Number(form.plazaId) : null}
        title="Elegir plaza para la reserva"
        hint="Tocá una plaza libre (sin reserva activa). Después confirmá con Usar esta plaza."
        filterPlaza={(p) => p.activa && !p.reservada}
        onPick={(p) => {
          setForm((f) => ({ ...f, plazaId: p.id }))
          setPlazas((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))
        }}
      />
    </AppLayout>
  )
}
