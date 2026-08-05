import { useEffect, useState } from 'react'
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
  TextField,
  Typography,
} from '@mui/material'
import { Printer } from 'lucide-react'
import api from '../api/client'
import { MEDIOS_PAGO } from '../utils/mediosPago'
import ComprobanteEgreso from './ComprobanteEgreso'

/**
 * Flujo egreso: medio de pago (si corresponde) → cobro → comprobante imprimible.
 * props.estadia: { id, patente, plazaCodigo, abonado, ticket? }
 */
export default function EgresoDialog({ open, estadia, onClose, onSuccess }) {
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cobro, setCobro] = useState(null)

  useEffect(() => {
    if (open) {
      setMedioPago('EFECTIVO')
      setError('')
      setCobro(null)
      setLoading(false)
    }
  }, [open, estadia?.id])

  const abonado = !!estadia?.abonado

  async function confirmar() {
    if (!estadia?.id) return
    setLoading(true)
    setError('')
    try {
      const body = abonado ? {} : { medioPago }
      const { data } = await api.post(`/estadias/${estadia.id}/cerrar`, body)
      setCobro(data)
      onSuccess?.(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el egreso')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    onClose?.()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth className="ticket-dialog">
      <DialogTitle>{cobro ? 'Egreso registrado' : 'Confirmar egreso'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!cobro && estadia && (
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Box>
              <Typography className="mono" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {estadia.patente}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plaza {estadia.plazaCodigo || '—'}
                {abonado ? ' · Abonado (sin cobro)' : ''}
              </Typography>
              {estadia.ticket?.codigo && (
                <Typography variant="caption" className="mono" color="text.secondary">
                  Ticket {estadia.ticket.codigo}
                </Typography>
              )}
            </Box>

            {!abonado && (
              <TextField
                select
                label="Medio de pago"
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                fullWidth
              >
                {MEDIOS_PAGO.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        )}

        {cobro && (
          <Box className="ticket-print-root" sx={{ pt: 1 }}>
            <ComprobanteEgreso cobro={cobro} />
          </Box>
        )}
      </DialogContent>
      <DialogActions className="no-print" sx={{ px: 2, pb: 2 }}>
        {!cobro ? (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="contained" color="secondary" onClick={confirmar} disabled={loading}>
              {loading ? 'Procesando…' : abonado ? 'Confirmar salida' : 'Cobrar y egresar'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose}>Cerrar</Button>
            <Button variant="contained" startIcon={<Printer size={16} />} onClick={() => window.print()}>
              Imprimir
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
