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
        minutosParaMediaHora: editando.minutosParaMediaHora ?? null,
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
        El egreso cobra de a <strong>30 minutos</strong> (fracción iniciada): la media hora vale la
        mitad del precio por hora. Ej: $500/h → $250 los primeros 30 min, $500 hasta la hora, $750 a
        los 90 min. El mínimo (si hay) se aplica cuando el cálculo da menos.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>$/hora</TableCell>
              <TableCell>$/30 min</TableCell>
              <TableCell>Mínimo</TableCell>
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
                <TableCell>
                  {t.precioPorHora != null
                    ? formatMoney(Math.round(Number(t.precioPorHora) * 50) / 100)
                    : '—'}
                </TableCell>
                <TableCell>{formatMoney(t.montoMinimo)}</TableCell>
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
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Precio por hora"
            type="number"
            value={form.precioPorHora}
            onChange={(e) => setForm({ ...form, precioPorHora: e.target.value })}
            fullWidth
            helperText={
              form.precioPorHora
                ? `Media hora (30 min): ${formatMoney(Math.round(Number(form.precioPorHora) * 50) / 100)}`
                : 'Se cobra por bloques de 30 minutos'
            }
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Monto mínimo (opcional)"
            type="number"
            value={form.montoMinimo}
            onChange={(e) => setForm({ ...form, montoMinimo: e.target.value })}
            fullWidth
            helperText="Si el cálculo por bloques da menos, se cobra este mínimo"
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
