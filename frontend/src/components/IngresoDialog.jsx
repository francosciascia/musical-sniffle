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
} from '@mui/material'
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
      let autoId

      const { data: autos } = await api.get('/autos')
      const existente = autos.find((a) => a.patente === patenteNorm)

      if (existente) {
        autoId = existente.id
      } else {
        if (!modelo.trim()) {
          setError('Indicá el modelo del auto')
          setLoading(false)
          return
        }
        const { data: nuevo } = await api.post('/autos', {
          patente: patenteNorm,
          tipo,
          modelo: modelo.trim(),
        })
        autoId = nuevo.id
      }

      await api.post('/estadias', null, {
        params: { autoId, plazaId: plaza.id },
      })

      handleClose()
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'No se pudo registrar el ingreso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Registrar ingreso — {plaza?.codigo}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {plaza?.reservada && (
            <Alert severity="warning">
              Plaza reservada{plaza.reservaCliente ? ` para ${plaza.reservaCliente}` : ''}.
              Solo puede ingresar el abonado.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Patente"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            required
            autoFocus
          />
          <TextField
            label="Modelo del auto"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ej: Toyota Corolla"
            helperText="Obligatorio si el auto es nuevo en el sistema"
          />
          <TextField
            select
            label="Tipo de vehículo"
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
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar ingreso'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
