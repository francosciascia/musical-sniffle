import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
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
import { isPatenteValida, normalizePatente, patenteHelperText } from '../utils/patente'

const TIPOS = ['AUTO', 'CAMIONETA', 'MOTO', 'CAMION']

export default function MisAutosPage() {
  const [autos, setAutos] = useState([])
  const [patente, setPatente] = useState('')
  const [modelo, setModelo] = useState('')
  const [tipo, setTipo] = useState('AUTO')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/cliente/autos')
      setAutos(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar tus autos')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function registrar(event) {
    event.preventDefault()
    setError('')
    setOk('')
    const patenteNorm = normalizePatente(patente)
    if (!isPatenteValida(patenteNorm)) {
      setError('Patente: mínimo 3 y máximo 8 caracteres (letras/números)')
      return
    }
    setLoading(true)
    try {
      await api.post('/cliente/autos', {
        patente: patenteNorm,
        tipo,
        modelo: modelo.trim(),
      })
      setPatente('')
      setModelo('')
      setOk('Auto registrado correctamente')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el auto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <Typography variant="h5" gutterBottom>
        Mis autos
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk('')}>{ok}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Registrar nuevo auto
        </Typography>
        <Box component="form" onSubmit={registrar} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Patente"
            value={patente}
            onChange={(e) => setPatente(normalizePatente(e.target.value).slice(0, 8))}
            required
            size="small"
            inputProps={{ className: 'mono', maxLength: 8 }}
            helperText={patenteHelperText(patente)}
          />
          <TextField
            label="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            required
            size="small"
            placeholder="Ej: Ford Ka"
          />
          <TextField
            select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {TIPOS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Agregar'}
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Patente</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Tipo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {autos.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Todavía no registraste autos
                </TableCell>
              </TableRow>
            )}
            {autos.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.patente}</TableCell>
                <TableCell>{a.modelo}</TableCell>
                <TableCell>{a.tipo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AppLayout>
  )
}
