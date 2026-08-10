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
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { MapPin } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import DateField from '../components/DateField'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import PagoAbonoDialog from '../components/PagoAbonoDialog'
import PlazaMapPickerDialog from '../components/PlazaMapPickerDialog'
import TablePager from '../components/TablePager'
import api from '../api/client'
import { usePagedRows } from '../hooks/usePagedRows'
import { colors } from '../theme/colors'

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

function motivoLabel(r) {
  if (r.motivoCobro === 'suspendida') return 'Suspendido'
  if (r.motivoCobro === 'vencido') return `Vencido hace ${Math.abs(r.diasParaVencer)} día(s)`
  if (r.motivoCobro === 'vence_hoy') return 'Vence hoy'
  if (r.motivoCobro === 'por_vencer') return `Vence en ${r.diasParaVencer} día(s)`
  if (r.motivoCobro === 'sin_fecha') return 'Sin fecha de fin'
  if (r.motivoCobro === 'al_dia') return `Al día hasta ${r.fechaFin}`
  return '—'
}

function motivoColor(motivo) {
  if (motivo === 'suspendida' || motivo === 'vencido') return 'error'
  if (motivo === 'vence_hoy' || motivo === 'por_vencer') return 'warning'
  if (motivo === 'al_dia') return 'success'
  return 'default'
}

export default function ReservasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'cobrar' ? 'cobrar' : 'todos'
  const [reservas, setReservas] = useState([])
  const [aCobrar, setACobrar] = useState([])
  const [clientes, setClientes] = useState([])
  const [plazas, setPlazas] = useState([])
  const [autos, setAutos] = useState([])
  const [tarifas, setTarifas] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [pagoTarget, setPagoTarget] = useState(null)

  const lista = tab === 'cobrar' ? aCobrar : reservas
  const { page, rowsPerPage, setPage, setRowsPerPage, paged, count } = usePagedRows(lista, {
    resetKey: tab,
  })

  const cargar = useCallback(async () => {
    try {
      const [resReservas, resCobrar, resUsuarios, resPlazas, resAutos, resTarifas] = await Promise.all([
        api.get('/admin/reservas'),
        api.get('/admin/reservas/a-cobrar'),
        api.get('/admin/usuarios'),
        api.get('/admin/plazas'),
        api.get('/autos'),
        api.get('/admin/tarifas'),
      ])
      setReservas(resReservas.data)
      setACobrar(resCobrar.data)
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
    if (!window.confirm('¿Cancelar este abono?')) return
    try {
      await api.post(`/admin/reservas/${id}/cancelar`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cancelar')
    }
  }

  async function suspender(id) {
    if (!window.confirm('¿Estás seguro de suspender este abono?')) return
    try {
      await api.post(`/admin/reservas/${id}/suspender`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo suspender')
    }
  }

  async function reactivar(id) {
    try {
      await api.post(`/admin/reservas/${id}/reactivar`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo reactivar')
    }
  }

  function setTab(next) {
    setSearchParams(next === 'cobrar' ? { tab: 'cobrar' } : {}, { replace: true })
  }

  const pendientes = aCobrar.filter((r) => r.motivoCobro && r.motivoCobro !== 'al_dia').length

  return (
    <AppLayout maxWidth="xl">
      <PageHeader
        title="Abonos"
        subtitle="Cliente + plaza fija + patentes. Registrá el pago indicando cómo cobraste."
        actions={
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Nuevo abono
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="todos" label="Todos" />
        <Tab value="cobrar" label={pendientes > 0 ? `A cobrar (${pendientes})` : 'A cobrar'} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk('')}>
          {ok}
        </Alert>
      )}

      {count === 0 ? (
        <EmptyState
          message={
            tab === 'cobrar'
              ? 'No hay abonos pendientes de cobro.'
              : 'Todavía no hay abonos.'
          }
          actionLabel={tab === 'todos' ? 'Nuevo abono' : undefined}
          onAction={tab === 'todos' ? () => setDialogOpen(true) : undefined}
        />
      ) : (
        <Box
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            overflow: 'auto',
            bgcolor: colors.surface,
          }}
        >
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Plaza</TableCell>
                <TableCell>Patentes</TableCell>
                <TableCell>Desde</TableCell>
                <TableCell>Hasta</TableCell>
                <TableCell>$/mes</TableCell>
                <TableCell>{tab === 'cobrar' ? 'Situación' : 'Estado'}</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.clienteNombre}</TableCell>
                  <TableCell>{r.plazaCodigo}</TableCell>
                  <TableCell>{r.patentes?.join(', ')}</TableCell>
                  <TableCell>{r.fechaInicio}</TableCell>
                  <TableCell>{r.fechaFin || '—'}</TableCell>
                  <TableCell>{formatMoney(r.montoMensual)}</TableCell>
                  <TableCell>
                    {tab === 'cobrar' ? (
                      <Chip label={motivoLabel(r)} color={motivoColor(r.motivoCobro)} size="small" />
                    ) : (
                      <Chip label={r.estado} color={estadoColor(r.estado)} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                  {(r.estado === 'ACTIVA' || r.estado === 'SUSPENDIDA') && (
                    <>
                      <Button size="small" variant="contained" onClick={() => setPagoTarget(r)}>
                        Registrar pago
                      </Button>
                      {r.estado === 'ACTIVA' && (
                        <Button size="small" color="warning" onClick={() => suspender(r.id)}>
                          Suspender
                        </Button>
                      )}
                      {r.estado === 'SUSPENDIDA' && (
                        <Button size="small" onClick={() => reactivar(r.id)}>
                          Reactivar
                        </Button>
                      )}
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
        </Box>
      )}

      <PagoAbonoDialog
        open={!!pagoTarget}
        reserva={pagoTarget}
        onClose={() => setPagoTarget(null)}
        onSuccess={() => {
          setOk('Pago registrado')
          cargar()
        }}
      />

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
              value={form.autoIds.map(String)}
              onChange={(e) => {
                const raw = e.target.value
                setAutoIds(typeof raw === 'string' ? raw.split(',').filter(Boolean) : raw.map(String))
              }}
              slotProps={{
                select: {
                  multiple: true,
                  renderValue: (selected) => {
                    const ids = selected || []
                    if (!ids.length) return 'Ninguno'
                    return ids
                      .map((id) => autosCliente.find((a) => String(a.id) === String(id))?.patente || id)
                      .join(', ')
                  },
                },
              }}
              fullWidth
              disabled={!form.clienteId || autosCliente.length === 0}
              helperText={
                !form.clienteId
                  ? 'Primero elegí un cliente'
                  : autosCliente.length === 0
                    ? 'El cliente no tiene autos — cargalos en Clientes → Ver autos'
                    : 'Tocá para marcar uno o más vehículos'
              }
            >
              {autosCliente.map((a) => (
                <MenuItem key={a.id} value={String(a.id)}>
                  {a.patente} ({a.tipo}
                  {precioPorTipo[a.tipo] != null
                    ? ` · ${formatMoney(precioPorTipo[a.tipo])}/mes`
                    : ''}
                  )
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField
                label="Fecha de inicio"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                fullWidth
                required
              />
              <DateField
                label="Fecha de fin"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
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
