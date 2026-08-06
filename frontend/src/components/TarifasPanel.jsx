import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import api from '../api/client'

function formatMoney(n) {
  if (n == null || n === '') return '—'
  return `$${Number(n).toLocaleString('es-AR')}`
}

/** Panel de tarifas reutilizable (Configuración / página legacy). */
export default function TarifasPanel() {
  const [tarifas, setTarifas] = useState([])
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/tarifas')
      setTarifas(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las tarifas')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function abrirEditar(tarifa) {
    setEditando(tarifa)
    setForm({
      precioPorHora: tarifa.precioPorHora,
      montoMinimo: tarifa.montoMinimo ?? '',
      minutosParaMediaHora: tarifa.minutosParaMediaHora ?? '',
      precioMensual: tarifa.precioMensual ?? '',
      activa: tarifa.activa,
    })
  }

  async function guardar() {
    setLoading(true)
    setError('')
    try {
      await api.put(`/admin/tarifas/${editando.id}`, {
        precioPorHora: Number(form.precioPorHora),
        montoMinimo: form.montoMinimo ? Number(form.montoMinimo) : null,
        minutosParaMediaHora: form.minutosParaMediaHora ? Number(form.minutosParaMediaHora) : null,
        precioMensual: form.precioMensual ? Number(form.precioMensual) : null,
        activa: form.activa,
      })
      setEditando(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Precios por hora (egreso) y abono mensual sugerido por tipo de vehículo. Usá montos redondos
        (ej. 45.000, 50.000).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 620 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>$/hora</TableCell>
              <TableCell>Mínimo</TableCell>
              <TableCell>Min. media hora</TableCell>
              <TableCell>$/mes</TableCell>
              <TableCell>Activa</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tarifas.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.tipoVehiculo}</TableCell>
                <TableCell>{formatMoney(t.precioPorHora)}</TableCell>
                <TableCell>{formatMoney(t.montoMinimo)}</TableCell>
                <TableCell>{t.minutosParaMediaHora ?? '—'}</TableCell>
                <TableCell>{formatMoney(t.precioMensual)}</TableCell>
                <TableCell>{t.activa ? 'Sí' : 'No'}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => abrirEditar(t)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editando} onClose={() => setEditando(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar tarifa — {editando?.tipoVehiculo}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
          <TextField
            label="Precio por hora"
            type="number"
            value={form.precioPorHora}
            onChange={(e) => setForm({ ...form, precioPorHora: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Monto mínimo (opcional)"
            type="number"
            value={form.montoMinimo}
            onChange={(e) => setForm({ ...form, montoMinimo: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Minutos para media hora (opcional)"
            type="number"
            value={form.minutosParaMediaHora}
            onChange={(e) => setForm({ ...form, minutosParaMediaHora: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Abono mensual (sugerido)"
            type="number"
            value={form.precioMensual}
            onChange={(e) => setForm({ ...form, precioMensual: e.target.value })}
            fullWidth
            helperText="Ej: 45000, 50000 (redondo)"
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!form.activa}
                onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              />
            }
            label="Tarifa activa"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditando(null)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={loading}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
