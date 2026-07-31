import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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

export default function TarifasPage() {
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
    <AppLayout>
      <Typography variant="h5" gutterBottom>
        Tarifas por tipo de vehículo
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>$/hora</TableCell>
              <TableCell>Mínimo</TableCell>
              <TableCell>Min. media hora</TableCell>
              <TableCell>Activa</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tarifas.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.tipoVehiculo}</TableCell>
                <TableCell>${t.precioPorHora}</TableCell>
                <TableCell>{t.montoMinimo != null ? `$${t.montoMinimo}` : '—'}</TableCell>
                <TableCell>{t.minutosParaMediaHora ?? '—'}</TableCell>
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
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Precio por hora"
            type="number"
            value={form.precioPorHora}
            onChange={(e) => setForm({ ...form, precioPorHora: e.target.value })}
          />
          <TextField
            label="Monto mínimo (opcional)"
            type="number"
            value={form.montoMinimo}
            onChange={(e) => setForm({ ...form, montoMinimo: e.target.value })}
          />
          <TextField
            label="Minutos para media hora (opcional)"
            type="number"
            value={form.minutosParaMediaHora}
            onChange={(e) => setForm({ ...form, minutosParaMediaHora: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.activa}
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
    </AppLayout>
  )
}
