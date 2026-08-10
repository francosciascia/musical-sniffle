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
import api from '../api/client'
import { colors } from '../theme/colors'
import MedioPagoCobroPanel, {
  buildCobroBody,
  formatMoney,
  validarCobroMedio,
} from './MedioPagoCobroPanel'

function formatFechaHora(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Flujo egreso: preview monto → medio de pago → cobro. Sin ticket de salida.
 * props.estadia: { id, patente, plazaCodigo, abonado, entrada?, ticket? }
 */
export default function EgresoDialog({ open, estadia, onClose, onSuccess }) {
  const [medio, setMedio] = useState('EFECTIVO')
  const [pagoExacto, setPagoExacto] = useState(true)
  const [montoRecibido, setMontoRecibido] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [mpInfo, setMpInfo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMp, setLoadingMp] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (!open || !estadia?.id) return undefined

    setMedio('EFECTIVO')
    setPagoExacto(true)
    setMontoRecibido('')
    setComprobante('')
    setMpInfo(null)
    setError('')
    setListo(false)
    setResultado(null)
    setLoading(false)
    setPreview(null)

    let cancelled = false
    async function loadPreview() {
      setLoadingPreview(true)
      try {
        const { data } = await api.get(`/estadias/${estadia.id}/calculo`)
        if (!cancelled) setPreview(data)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'No se pudo calcular el monto')
        }
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }
    loadPreview()
    return () => {
      cancelled = true
    }
  }, [open, estadia?.id])

  const abonado = !!(preview?.abonado ?? estadia?.abonado)
  const monto = Number(preview?.monto) || 0
  const requierePago = !abonado && monto > 0
  const esperandoQr = requierePago && medio === 'QR' && !!mpInfo?.configurado

  useEffect(() => {
    if (!open || !esperandoQr || !estadia?.id || listo) return undefined

    let cancelled = false
    const tick = async () => {
      try {
        const { data } = await api.get(`/estadias/${estadia.id}/mercadopago-estado`)
        if (cancelled || !data?.aprobado) return
        // Recargar cobro cerrado
        try {
          const cobro = await api.get(`/estadias/${estadia.id}/calculo`)
          // estadia ya cerrada → calculo puede fallar 409; usar mensaje simple
          setResultado({
            patente: estadia.patente,
            monto: preview?.monto ?? monto,
            abonado: false,
          })
        } catch {
          setResultado({
            patente: estadia.patente,
            monto: preview?.monto ?? monto,
            abonado: false,
          })
        }
        setListo(true)
        onSuccess?.(data)
      } catch {
        /* seguir */
      }
    }

    tick()
    const id = setInterval(tick, 2500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [open, esperandoQr, estadia, listo, preview?.monto, monto, onSuccess])

  async function generarQr() {
    if (!estadia?.id) return
    setLoadingMp(true)
    setError('')
    try {
      const { data } = await api.post(`/estadias/${estadia.id}/mercadopago-preferencia`)
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
    if (!estadia?.id) return

    if (requierePago) {
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
    }

    setLoading(true)
    setError('')
    try {
      const body = requierePago
        ? buildCobroBody({
            medio,
            monto,
            pagoExacto,
            montoRecibido,
            comprobante,
            mpInfo,
          })
        : {}
      const { data } = await api.post(`/estadias/${estadia.id}/cerrar`, body)
      setResultado(data)
      setListo(true)
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
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (listo) {
            handleClose()
            return
          }
          if (!loading && !loadingPreview && !esperandoQr) confirmar()
        }}
      >
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
          {listo ? 'Egreso registrado' : 'Confirmar egreso'}
        </DialogTitle>
        <DialogContent sx={{ pt: '4px !important', pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {!listo && estadia && (
            <Stack spacing={1.75} sx={{ pt: 0.5 }}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: '6px',
                  bgcolor: colors.surfaceAlt,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Typography className="mono" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2 }}>
                  {estadia.patente}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                  Plaza {estadia.plazaCodigo || 'Sin asignar'}
                  {abonado ? ' · Abonado (sin cobro)' : ''}
                </Typography>
                {estadia.ticket?.codigo && (
                  <Typography variant="caption" className="mono" color="text.secondary" display="block">
                    Ticket ingreso {estadia.ticket.codigo}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Ingreso:{' '}
                  <Box component="span" className="mono" sx={{ fontWeight: 600 }}>
                    {formatFechaHora(preview?.entrada || estadia.entrada) ||
                      (loadingPreview ? '…' : '—')}
                  </Box>
                </Typography>
                <Typography
                  className="mono"
                  sx={{ mt: 0.75, fontWeight: 800, fontSize: '1.35rem', color: colors.primaryDark }}
                >
                  {loadingPreview
                    ? 'Calculando…'
                    : abonado || monto === 0
                      ? 'Sin cargo'
                      : formatMoney(monto)}
                </Typography>
              </Box>

              {requierePago && (
                <MedioPagoCobroPanel
                  monto={monto}
                  medio={medio}
                  onMedioChange={(v) => {
                    setMedio(v)
                    setError('')
                    setMpInfo(null)
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
              )}
            </Stack>
          )}

          {listo && resultado && (
            <Stack spacing={1} sx={{ pt: 0.5 }}>
              <Alert severity="success">Salida registrada. No se imprime ticket de egreso.</Alert>
              <Typography className="mono" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {resultado.patente}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resultado.abonado || Number(resultado.monto) === 0
                  ? 'Sin cargo'
                  : `Cobrado ${formatMoney(resultado.monto)}`}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
          {!listo ? (
            <>
              <Button type="button" onClick={handleClose} disabled={loading}>
                {esperandoQr ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!esperandoQr && (
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  disabled={loading || loadingPreview}
                  sx={{ minHeight: 40 }}
                >
                  {loading
                    ? 'Procesando…'
                    : abonado || !requierePago
                      ? 'Confirmar salida'
                      : 'Cobrar y egresar'}
                </Button>
              )}
            </>
          ) : (
            <Button type="submit" variant="contained" sx={{ minHeight: 40 }}>
              Listo
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}
