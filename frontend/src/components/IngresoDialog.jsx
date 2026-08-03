import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowDownToLine } from 'lucide-react'
import api from '../api/client'

const TIPOS = ['AUTO', 'CAMIONETA', 'MOTO', 'CAMION']

export default function IngresoDialog({ open, plaza, onClose, onSuccess }) {
  const [patente, setPatente] = useState('')
  const [modelo, setModelo] = useState('')
  const [tipo, setTipo] = useState('AUTO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPatente('')
      setModelo('')
      setTipo('AUTO')
      setError('')
    }
  }, [open])

  function handleClose() {
    if (loading) return
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const patenteNorm = patente.trim().toUpperCase()
      if (!patenteNorm) {
        setError('Indicá la patente')
        setLoading(false)
        return
      }
      if (!modelo.trim()) {
        setError('Indicá el modelo del auto')
        setLoading(false)
        return
      }

      let autoId
      const { data: autos } = await api.get('/autos')
      const existente = autos.find((a) => a.patente === patenteNorm)

      if (existente) {
        autoId = existente.id
      } else {
        const { data: nuevo } = await api.post('/autos', {
          patente: patenteNorm,
          tipo,
          modelo: modelo.trim(),
        })
        autoId = nuevo.id
      }

      const params = { autoId }
      if (plaza?.id) {
        params.plazaId = plaza.id
      }

      const { data: estadia } = await api.post('/estadias', null, { params })

      handleClose()
      onSuccess?.(estadia)
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'No se pudo registrar el ingreso',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          {plaza ? `Ingreso · Plaza ${plaza.codigo}` : 'Registrar ingreso'}
          {plaza?.reservada && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 0.5, fontWeight: 500 }}>
              Plaza reservada
              {plaza.reservaCliente ? ` · ${plaza.reservaCliente}` : ''}
            </Typography>
          )}
          {!plaza && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
              Solo patente y modelo. La plaza es opcional.
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Patente"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            required
            autoFocus
            inputProps={{ className: 'mono' }}
          />
          <TextField
            label="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ej: Toyota Corolla"
            required
            helperText="Obligatorio"
          />
          <TextField
            select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={<ArrowDownToLine size={16} />}
          >
            {loading ? 'Registrando…' : 'Confirmar ingreso'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
