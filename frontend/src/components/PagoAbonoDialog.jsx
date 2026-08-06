import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Banknote, ExternalLink, QrCode, Smartphone, Wallet } from 'lucide-react'
import api from '../api/client'
import { colors } from '../theme/colors'

const MEDIOS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: Wallet },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: Smartphone },
  { value: 'QR', label: 'QR (Mercado Pago)', icon: QrCode },
]

function formatMoney(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '—'
  return `$${Number(n).toLocaleString('es-AR')}`
}

/**
 * props.reserva: { id, clienteNombre, plazaCodigo, montoMensual, fechaFin, patentes }
 */
export default function PagoAbonoDialog({ open, reserva, onClose, onSuccess }) {
  const [medio, setMedio] = useState('EFECTIVO')
  const [pagoExacto, setPagoExacto] = useState(true)
  const [montoRecibido, setMontoRecibido] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [mpInfo, setMpInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMp, setLoadingMp] = useState(false)
  const [error, setError] = useState('')

  const monto = Number(reserva?.montoMensual) || 0

  const vuelto = useMemo(() => {
    if (medio !== 'EFECTIVO' || pagoExacto) return 0
    const rec = Number(montoRecibido)
    if (!Number.isFinite(rec)) return null
    return Math.round((rec - monto) * 100) / 100
  }, [medio, pagoExacto, montoRecibido, monto])

  useEffect(() => {
    if (open) {
      setMedio('EFECTIVO')
      setPagoExacto(true)
      setMontoRecibido('')
      setComprobante('')
      setMpInfo(null)
      setError('')
      setLoading(false)
      setLoadingMp(false)
    }
  }, [open, reserva?.id])

  async function generarQr() {
    if (!reserva?.id) return
    setLoadingMp(true)
    setError('')
    try {
      const { data } = await api.post(`/admin/reservas/${reserva.id}/mercadopago-preferencia`)
      setMpInfo(data)
      if (!data.configurado) {
        setError(data.mensaje || 'Mercado Pago no configurado')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la preferencia de Mercado Pago')
    } finally {
      setLoadingMp(false)
    }
  }

  async function confirmar() {
    if (!reserva?.id) return

    if (medio === 'EFECTIVO' && !pagoExacto) {
      const rec = Number(montoRecibido)
      if (!Number.isFinite(rec) || rec < monto) {
        setError(`El monto recibido debe ser al menos ${formatMoney(monto)}`)
        return
      }
    }
    if (medio === 'TRANSFERENCIA' && !comprobante.trim()) {
      setError('Ingresá el N° o referencia del comprobante')
      return
    }

    setLoading(true)
    setError('')
    try {
      const body = { medioPago: medio }
      if (medio === 'EFECTIVO') {
        body.montoRecibido = pagoExacto ? monto : Number(montoRecibido)
      }
      if (medio === 'TRANSFERENCIA' || medio === 'QR') {
        if (comprobante.trim()) body.referenciaComprobante = comprobante.trim()
      }
      if (mpInfo?.preferenceId) {
        body.mercadopagoId = mpInfo.preferenceId
      }
      if (medio === 'TRANSFERENCIA' && !body.referenciaComprobante) {
        setError('Ingresá el N° o referencia del comprobante')
        setLoading(false)
        return
      }

      const { data } = await api.post(`/admin/reservas/${reserva.id}/pago-mensual`, body)
      onSuccess?.(data)
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const linkMp = mpInfo?.sandboxInitPoint || mpInfo?.initPoint

  return (
    <Dialog open={open} onClose={() => !loading && onClose?.()} maxWidth="xs" fullWidth>
      <DialogTitle>Registrar pago</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {reserva && (
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{reserva.clienteNombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                Plaza {reserva.plazaCodigo}
                {reserva.patentes?.length ? ` · ${reserva.patentes.join(', ')}` : ''}
              </Typography>
              <Typography className="mono" sx={{ mt: 0.5, fontWeight: 700, fontSize: '1.1rem' }}>
                {formatMoney(monto)}
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary">
              Forma de pago
            </Typography>
            <Stack spacing={1}>
              {MEDIOS.map(({ value, label, icon: Icon }) => {
                const selected = medio === value
                return (
                  <Button
                    key={value}
                    variant={selected ? 'contained' : 'outlined'}
                    onClick={() => {
                      setMedio(value)
                      setError('')
                      setMpInfo(null)
                    }}
                    startIcon={<Icon size={18} />}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                  >
                    {label}
                  </Button>
                )
              })}
            </Stack>

            {medio === 'EFECTIVO' && (
              <Box
                sx={{
                  p: 1.5,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  bgcolor: colors.surfaceAlt,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Efectivo
                </Typography>
                <RadioGroup
                  value={pagoExacto ? 'exacto' : 'diferencia'}
                  onChange={(e) => setPagoExacto(e.target.value === 'exacto')}
                >
                  <FormControlLabel value="exacto" control={<Radio size="small" />} label="Paga justo" />
                  <FormControlLabel
                    value="diferencia"
                    control={<Radio size="small" />}
                    label="Paga con billete / diferencia"
                  />
                </RadioGroup>
                {!pagoExacto && (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      label="Monto recibido"
                      type="number"
                      size="small"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      inputProps={{ min: monto, step: 100 }}
                      fullWidth
                    />
                    <Typography
                      className="mono"
                      sx={{
                        fontWeight: 700,
                        color: vuelto != null && vuelto >= 0 ? colors.primary : 'error.main',
                      }}
                    >
                      Vuelto: {vuelto == null ? '—' : formatMoney(vuelto)}
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}

            {medio === 'TRANSFERENCIA' && (
              <Box
                sx={{
                  p: 1.5,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  bgcolor: colors.surfaceAlt,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Transferencia
                </Typography>
                <TextField
                  label="N° / referencia del comprobante"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  fullWidth
                  required
                  size="small"
                  placeholder="Ej. CVU… o ID de operación"
                  helperText="Queda guardado en el historial del pago"
                />
              </Box>
            )}

            {medio === 'QR' && (
              <Box
                sx={{
                  p: 1.5,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  bgcolor: colors.surfaceAlt,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  QR Mercado Pago
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Generá el link de pago. Cuando el cliente pague, confirmá acá (el webhook automático
                  se puede completar después).
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={generarQr}
                  disabled={loadingMp}
                  sx={{ mb: 1 }}
                >
                  {loadingMp ? 'Generando…' : 'Generar link / preferencia MP'}
                </Button>
                {linkMp && (
                  <Button
                    component="a"
                    href={linkMp}
                    target="_blank"
                    rel="noreferrer"
                    fullWidth
                    variant="contained"
                    startIcon={<ExternalLink size={16} />}
                    sx={{ mb: 1 }}
                  >
                    Abrir pago Mercado Pago
                  </Button>
                )}
                {mpInfo?.configurado && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Pref: {mpInfo.preferenceId}
                  </Typography>
                )}
                <TextField
                  label="ID operación / nota (opcional)"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Si el cliente te muestra el pago, anotá el ID acá"
                />
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => onClose?.()} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<Banknote size={16} />}
          onClick={confirmar}
          disabled={loading || !reserva}
        >
          {loading ? 'Registrando…' : 'Confirmar pago'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
