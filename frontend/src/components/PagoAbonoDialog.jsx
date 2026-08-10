import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { Banknote } from 'lucide-react'
import api from '../api/client'
import MedioPagoCobroPanel, {
  buildCobroBody,
  formatMoney,
  validarCobroMedio,
} from './MedioPagoCobroPanel'

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
  const [autoOk, setAutoOk] = useState('')

  const monto = Number(reserva?.montoMensual) || 0
  const esperandoQr = medio === 'QR' && !!mpInfo?.configurado

  useEffect(() => {
    if (open) {
      setMedio('EFECTIVO')
      setPagoExacto(true)
      setMontoRecibido('')
      setComprobante('')
      setMpInfo(null)
      setError('')
      setAutoOk('')
      setLoading(false)
      setLoadingMp(false)
    }
  }, [open, reserva?.id])

  useEffect(() => {
    if (!open || !esperandoQr || !reserva?.id) return undefined

    let cancelled = false
    const tick = async () => {
      try {
        const { data } = await api.get(`/admin/reservas/${reserva.id}/mercadopago-estado`)
        if (cancelled || !data?.aprobado) return
        setAutoOk(data.mensaje || 'Pago acreditado')
        onSuccess?.(data)
        setTimeout(() => {
          if (!cancelled) onClose?.()
        }, 800)
      } catch {
        /* seguir polleando */
      }
    }

    tick()
    const id = setInterval(tick, 2500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [open, esperandoQr, reserva?.id, onSuccess, onClose])

  async function generarQr() {
    if (!reserva?.id) return
    setLoadingMp(true)
    setError('')
    setAutoOk('')
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
    if (!reserva?.id || esperandoQr) return

    const msg = validarCobroMedio({
      medio,
      monto,
      pagoExacto,
      montoRecibido,
      comprobante,
    })
    if (msg) {
      setError(msg)
      return
    }

    setLoading(true)
    setError('')
    try {
      const body = buildCobroBody({
        medio,
        monto,
        pagoExacto,
        montoRecibido,
        comprobante,
        mpInfo,
      })
      const { data } = await api.post(`/admin/reservas/${reserva.id}/pago-mensual`, body)
      onSuccess?.(data)
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !loading && onClose?.()} maxWidth="xs" fullWidth>
      <DialogTitle>Registrar pago</DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {autoOk && (
          <Alert severity="success" sx={{ mb: 1.5 }}>
            {autoOk}
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

            <MedioPagoCobroPanel
              monto={monto}
              medio={medio}
              onMedioChange={(v) => {
                setMedio(v)
                setError('')
                setMpInfo(null)
                setAutoOk('')
              }}
              pagoExacto={pagoExacto}
              onPagoExactoChange={setPagoExacto}
              montoRecibido={montoRecibido}
              onMontoRecibidoChange={setMontoRecibido}
              comprobante={comprobante}
              onComprobanteChange={setComprobante}
              mpInfo={mpInfo}
              onGenerarQr={generarQr}
              loadingMp={loadingMp}
              esperandoPago={esperandoQr}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => onClose?.()} disabled={loading}>
          {esperandoQr ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!esperandoQr && (
          <Button
            variant="contained"
            startIcon={<Banknote size={16} />}
            onClick={confirmar}
            disabled={loading || !reserva}
          >
            {loading ? 'Registrando…' : 'Confirmar pago'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
