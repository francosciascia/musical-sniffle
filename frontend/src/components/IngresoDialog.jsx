import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowDownToLine, MapPin } from 'lucide-react'
import api from '../api/client'
import PlazaMapPickerDialog from './PlazaMapPickerDialog'
import { isPatenteValida, normalizePatente, patenteHelperText } from '../utils/patente'

const TIPOS = ['AUTO', 'CAMIONETA', 'MOTO', 'CAMION']

export default function IngresoDialog({ open, plaza, onClose, onSuccess }) {
  const [patente, setPatente] = useState('')
  const [modelo, setModelo] = useState('')
  const [tipo, setTipo] = useState('AUTO')
  const [plazaElegida, setPlazaElegida] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPatente('')
      setModelo('')
      setTipo('AUTO')
      setPlazaElegida(plaza || null)
      setError('')
      setMapOpen(false)
    }
  }, [open, plaza])

  function handleClose() {
    if (loading) return
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const patenteNorm = normalizePatente(patente)
      if (!isPatenteValida(patenteNorm)) {
        setError('Patente: mínimo 3 y máximo 8 caracteres (letras/números)')
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
      const existente = autos.find((a) => normalizePatente(a.patente) === patenteNorm)

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
      if (plazaElegida?.id) {
        params.plazaId = plazaElegida.id
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
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              pb: 1,
              fontFamily: '"Oswald", "Inter", sans-serif',
              fontWeight: 600,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              fontSize: '1.15rem',
            }}
          >
            {plazaElegida ? `Ingreso · Plaza ${plazaElegida.codigo}` : 'Registrar ingreso'}
          </DialogTitle>
          <DialogContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.75,
              pt: '8px !important',
              pb: 1,
            }}
          >
            {plazaElegida?.reservada && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Plaza reservada
                {plazaElegida.reservaCliente ? ` · ${plazaElegida.reservaCliente}` : ''}
              </Alert>
            )}
            {!plazaElegida && (
              <Typography variant="body2" color="text.secondary">
                Patente y modelo. La plaza es opcional (mapa).
              </Typography>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label="Plaza"
                value={plazaElegida ? plazaElegida.codigo : ''}
                placeholder="Sin asignar"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
                inputProps={{
                  className: plazaElegida ? 'mono' : undefined,
                }}
                helperText={plazaElegida ? 'Opcional · tocá Mapa para cambiar' : 'Opcional'}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  '& .MuiInputBase-input': {
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'nowrap',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    opacity: 0.75,
                    color: 'text.secondary',
                  },
                }}
              />
              <Button
                variant="outlined"
                startIcon={<MapPin size={16} />}
                onClick={() => setMapOpen(true)}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap', mt: 0.5 }}
              >
                Mapa
              </Button>
            </Stack>
            {plazaElegida && (
              <Button size="small" onClick={() => setPlazaElegida(null)} sx={{ alignSelf: 'flex-start', mt: -0.5 }}>
                Quitar plaza
              </Button>
            )}

            <TextField
              label="Patente"
              value={patente}
              onChange={(e) => setPatente(normalizePatente(e.target.value).slice(0, 8))}
              required
              autoFocus
              inputProps={{ className: 'mono', maxLength: 8 }}
              helperText={patenteHelperText(patente)}
            />
            <TextField
              label="Modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ej: Toyota Corolla"
              required
              helperText="Obligatorio"
            />
            <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<ArrowDownToLine size={16} />}
              sx={{ minHeight: 40 }}
            >
              {loading ? 'Registrando…' : 'Confirmar ingreso'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <PlazaMapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        selectedId={plazaElegida?.id}
        title="Elegir plaza para el ingreso"
        hint={
          tipo === 'MOTO'
            ? 'Libre, o con una moto si está permitida la regla de 2 motos.'
            : 'Tocá una plaza libre. Las ocupadas no se usan para auto/camioneta.'
        }
        filterPlaza={(p) => {
          if (!p.activa || p.reservada) return false
          if (!p.ocupada) return true
          return tipo === 'MOTO' && !!p.puedeOtraMoto
        }}
        onPick={(p) => setPlazaElegida(p)}
      />
    </>
  )
}
