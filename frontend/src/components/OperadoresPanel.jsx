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
import { Plus, UserCog } from 'lucide-react'
import api from '../api/client'
import { useFormArrowNav } from '../hooks/useFormArrowNav'
import { capitalizarNombre } from '../utils/texto'
import { colors } from '../theme/colors'

const EMPTY = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  telefono: '',
  password: '',
  legajo: '',
}

export default function OperadoresPanel() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/usuarios')
      setItems(data.filter((u) => u.rol === 'USUARIO'))
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function crear() {
    setLoading(true)
    setError('')
    setOk('')
    try {
      await api.post('/admin/usuarios/operadores', {
        nombre: capitalizarNombre(form.nombre),
        apellido: capitalizarNombre(form.apellido),
        dni: form.dni.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        password: form.password,
        legajo: form.legajo.trim(),
      })
      setOpen(false)
      setForm(EMPTY)
      setOk('Usuario creado')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el usuario')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActivo(op) {
    setError('')
    try {
      await api.patch(`/admin/usuarios/${op.id}/activo`, { activo: !op.activo })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar')
    }
  }

  const formOk =
    form.nombre.trim() &&
    form.apellido.trim() &&
    form.dni.trim().length >= 7 &&
    form.email.includes('@') &&
    form.telefono.trim().length >= 8 &&
    form.password.length >= 6 &&
    form.legajo.trim()

  const onFormArrowNav = useFormArrowNav()

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 1.5, width: '100%' }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          <UserCog size={18} color={colors.primary} />
          <Typography sx={{ fontWeight: 700 }}>Usuarios</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setOpen(true)}
          sx={{ ml: { sm: 'auto' } }}
        >
          Nuevo usuario
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Personal de operación (rol usuario). Los clientes no tienen login.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setOk('')}>
          {ok}
        </Alert>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Legajo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios todavía.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((op) => (
                <TableRow key={op.id} hover>
                  <TableCell>
                    {op.nombre} {op.apellido}
                  </TableCell>
                  <TableCell className="mono">{op.legajo}</TableCell>
                  <TableCell className="mono" sx={{ fontSize: '0.8rem' }}>
                    {op.email}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={op.activo ? 'Activo' : 'Inactivo'}
                      color={op.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color={op.activo ? 'error' : 'primary'} onClick={() => toggleActivo(op)}>
                      {op.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="xs" fullWidth>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!loading && formOk) crear()
          }}
        >
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogContent
            onKeyDown={onFormArrowNav}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, pt: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              ↑↓ pasan de campo · Enter crea.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField label="Nombre" value={form.nombre} onChange={setField('nombre')} fullWidth required />
              <TextField label="Apellido" value={form.apellido} onChange={setField('apellido')} fullWidth required />
            </Stack>
            <TextField label="Legajo" value={form.legajo} onChange={setField('legajo')} fullWidth required />
            <TextField label="DNI" value={form.dni} onChange={setField('dni')} fullWidth required />
            <TextField label="Email" type="email" value={form.email} onChange={setField('email')} fullWidth required />
            <TextField label="Teléfono" value={form.telefono} onChange={setField('telefono')} fullWidth required />
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={setField('password')}
              fullWidth
              required
              helperText="Mínimo 6 caracteres"
            />
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading || !formOk}>
              {loading ? 'Guardando…' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
