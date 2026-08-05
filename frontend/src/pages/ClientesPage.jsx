import { useCallback, useEffect, useMemo, useState } from 'react'
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
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Car, Pencil, Plus, Search, Users } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import api from '../api/client'
import { colors } from '../theme/colors'

const EMPTY = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  telefono: '',
}

const EMPTY_AUTO = { patente: '', tipo: 'AUTO', modelo: '' }

const TIPOS = ['AUTO', 'CAMIONETA', 'MOTO', 'CAMION']

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const [autosCliente, setAutosCliente] = useState(null)
  const [autos, setAutos] = useState([])
  const [autoForm, setAutoForm] = useState(EMPTY_AUTO)
  const [autoLoading, setAutoLoading] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/usuarios')
      setClientes(data.filter((u) => u.rol === 'CLIENTE'))
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los clientes')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter((c) => {
      const blob = `${c.nombre} ${c.apellido} ${c.email} ${c.dni} ${c.telefono}`.toLowerCase()
      return blob.includes(term)
    })
  }, [clientes, q])

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function abrirNuevo() {
    setError('')
    setEditando(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function abrirEditar(cliente) {
    setError('')
    setEditando(cliente)
    setForm({
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      dni: cliente.dni || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
    })
    setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    setError('')
    setOk('')
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
    }
    try {
      if (editando) {
        await api.put(`/admin/clientes/${editando.id}`, payload)
        setOk('Cliente actualizado')
      } else {
        await api.post('/admin/usuarios/clientes', payload)
        setOk('Cliente creado. Ya podés vincularlo a una reserva.')
      }
      setOpen(false)
      setEditando(null)
      setForm(EMPTY)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || (editando ? 'No se pudo actualizar' : 'No se pudo crear el cliente'))
    } finally {
      setLoading(false)
    }
  }

  async function abrirAutos(cliente) {
    setError('')
    setAutosCliente(cliente)
    setAutoForm(EMPTY_AUTO)
    try {
      const { data } = await api.get(`/admin/clientes/${cliente.id}/autos`)
      setAutos(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los autos')
      setAutos([])
    }
  }

  async function crearAuto() {
    if (!autosCliente) return
    setAutoLoading(true)
    setError('')
    try {
      await api.post(`/admin/clientes/${autosCliente.id}/autos`, {
        patente: autoForm.patente.trim().toUpperCase(),
        tipo: autoForm.tipo,
        modelo: autoForm.modelo.trim(),
      })
      setAutoForm(EMPTY_AUTO)
      setOk(`Auto cargado para ${autosCliente.nombre}`)
      const { data } = await api.get(`/admin/clientes/${autosCliente.id}/autos`)
      setAutos(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el auto')
    } finally {
      setAutoLoading(false)
    }
  }

  const formOk =
    form.nombre.trim() &&
    form.apellido.trim() &&
    form.dni.trim().length >= 7 &&
    form.email.includes('@') &&
    form.telefono.trim().length >= 8

  const autoOk = autoForm.patente.trim().length >= 5 && autoForm.modelo.trim()

  return (
    <AppLayout>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Users size={22} color={colors.primary} />
            <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Clientes
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Alta, edición y autos para reservas.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={abrirNuevo}>
          Nuevo cliente
        </Button>
      </Stack>

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

      <TextField
        size="small"
        placeholder="Buscar por nombre, email, DNI…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        fullWidth
        sx={{ mb: 2, maxWidth: { sm: 360 } }}
        InputProps={{
          startAdornment: (
            <Box sx={{ display: 'flex', mr: 1, color: 'text.secondary' }}>
              <Search size={16} />
            </Box>
          ),
        }}
      />

      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    {clientes.length ? 'Sin resultados.' : 'Todavía no hay clientes. Creá el primero.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    {c.nombre} {c.apellido}
                  </TableCell>
                  <TableCell className="mono" sx={{ fontSize: '0.8rem' }}>
                    {c.email}
                  </TableCell>
                  <TableCell className="mono">{c.dni}</TableCell>
                  <TableCell className="mono">{c.telefono}</TableCell>
                  <TableCell>{c.activo ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      <Button size="small" startIcon={<Pencil size={14} />} onClick={() => abrirEditar(c)}>
                        Editar
                      </Button>
                      <Button size="small" startIcon={<Car size={14} />} onClick={() => abrirAutos(c)}>
                        Autos
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, width: '100%' } }}
      >
        <DialogTitle>{editando ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {editando
              ? 'Actualizá nombre, DNI, email o teléfono.'
              : 'Después podés cargarle autos y usarlo en Reservas.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField label="Nombre" value={form.nombre} onChange={setField('nombre')} fullWidth required />
            <TextField label="Apellido" value={form.apellido} onChange={setField('apellido')} fullWidth required />
          </Stack>
          <TextField label="DNI" value={form.dni} onChange={setField('dni')} fullWidth required />
          <TextField label="Email" type="email" value={form.email} onChange={setField('email')} fullWidth required />
          <TextField label="Teléfono" value={form.telefono} onChange={setField('telefono')} fullWidth required />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={() => {
              setOpen(false)
              setEditando(null)
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardar} disabled={loading || !formOk}>
            {loading ? 'Guardando…' : editando ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!autosCliente}
        onClose={() => setAutosCliente(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, width: '100%' } }}
      >
        <DialogTitle>
          Autos · {autosCliente?.nombre} {autosCliente?.apellido}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Estos vehículos aparecen al crear una reserva para este cliente.
          </Typography>

          {autos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Todavía no tiene autos.
            </Typography>
          ) : (
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Patente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Modelo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {autos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="mono">{a.patente}</TableCell>
                    <TableCell>{a.tipo}</TableCell>
                    <TableCell>{a.modelo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Agregar auto
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Patente"
                value={autoForm.patente}
                onChange={(e) => setAutoForm((f) => ({ ...f, patente: e.target.value.toUpperCase() }))}
                fullWidth
                inputProps={{ className: 'mono' }}
              />
              <TextField
                select
                label="Tipo"
                value={autoForm.tipo}
                onChange={(e) => setAutoForm((f) => ({ ...f, tipo: e.target.value }))}
                fullWidth
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Modelo"
              value={autoForm.modelo}
              onChange={(e) => setAutoForm((f) => ({ ...f, modelo: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setAutosCliente(null)}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={crearAuto}
            disabled={autoLoading || !autoOk}
            startIcon={<Plus size={16} />}
          >
            {autoLoading ? 'Guardando…' : 'Agregar auto'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
