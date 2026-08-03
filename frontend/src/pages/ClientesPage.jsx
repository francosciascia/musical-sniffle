import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Plus, Search, Users } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import api from '../api/client'
import { colors } from '../theme/colors'

const EMPTY = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  telefono: '',
  password: '',
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY)

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

  async function crear() {
    setLoading(true)
    setError('')
    setOk('')
    try {
      await api.post('/admin/usuarios/clientes', {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        password: form.password,
      })
      setOpen(false)
      setForm(EMPTY)
      setOk('Cliente creado. Ya podés vincularlo a una reserva.')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el cliente')
    } finally {
      setLoading(false)
    }
  }

  const formOk =
    form.nombre.trim() &&
    form.apellido.trim() &&
    form.dni.trim().length >= 7 &&
    form.email.includes('@') &&
    form.telefono.trim().length >= 8 &&
    form.password.length >= 6

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
            Alta simple para vincular con reservas mensuales.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => {
            setError('')
            setOpen(true)
          }}
        >
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
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
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
        fullScreen={false}
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, width: '100%' } }}
      >
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Con estos datos después lo elegís al crear una reserva.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField label="Nombre" value={form.nombre} onChange={setField('nombre')} fullWidth required />
            <TextField label="Apellido" value={form.apellido} onChange={setField('apellido')} fullWidth required />
          </Stack>
          <TextField label="DNI" value={form.dni} onChange={setField('dni')} fullWidth required helperText="7 a 20 caracteres" />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={setField('email')}
            fullWidth
            required
          />
          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={setField('telefono')}
            fullWidth
            required
            helperText="Mínimo 8 caracteres"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={setField('password')}
            fullWidth
            required
            helperText="Para que pueda entrar al portal (mín. 6)"
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={crear} disabled={loading || !formOk}>
            {loading ? 'Guardando…' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
