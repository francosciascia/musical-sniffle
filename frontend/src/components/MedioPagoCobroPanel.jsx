import { useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ExternalLink, QrCode, Smartphone, Wallet } from 'lucide-react'
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
 * Campos compartidos de cobro (abono / egreso visitante).
 */
export default function MedioPagoCobroPanel({
  monto,
  medio,
  onMedioChange,
  pagoExacto,
  onPagoExactoChange,
  montoRecibido,
  onMontoRecibidoChange,
  comprobante,
  onComprobanteChange,
  mpInfo,
  onGenerarQr,
  loadingMp = false,
  esperandoPago = false,
}) {
  const vuelto = useMemo(() => {
    if (medio !== 'EFECTIVO' || pagoExacto) return 0
    const rec = Number(montoRecibido)
    if (!Number.isFinite(rec)) return null
    return Math.round((rec - Number(monto)) * 100) / 100
  }, [medio, pagoExacto, montoRecibido, monto])

  const linkMp = mpInfo?.checkoutUrl || mpInfo?.sandboxInitPoint || mpInfo?.initPoint

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Forma de pago
      </Typography>
      <Stack spacing={1}>
        {MEDIOS.map(({ value, label, icon: Icon }) => {
          const selected = medio === value
          return (
            <Button
              key={value}
              type="button"
              variant={selected ? 'contained' : 'outlined'}
              onClick={() => onMedioChange?.(value)}
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
            onChange={(e) => onPagoExactoChange?.(e.target.value === 'exacto')}
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
                onChange={(e) => onMontoRecibidoChange?.(e.target.value)}
                inputProps={{ min: Number(monto) || 0, step: 100 }}
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
            onChange={(e) => onComprobanteChange?.(e.target.value)}
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
            Generá el link. Cuando el cliente pague, el sistema lo registra solo (no hace falta
            confirmar a mano).
          </Typography>
          <Button
            type="button"
            variant="outlined"
            fullWidth
            onClick={onGenerarQr}
            disabled={loadingMp || !(Number(monto) > 0)}
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
              {mpInfo?.sandbox ? 'Abrir pago (prueba)' : 'Abrir pago Mercado Pago'}
            </Button>
          )}
          {esperandoPago && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Esperando acreditación de Mercado Pago…
            </Alert>
          )}
          {mpInfo?.sandbox && (
            <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 1 }}>
              Modo prueba: cuenta <strong>Comprador</strong> o tarjeta de prueba (4509 9535 6623
              3704 / CVV 123 / APRO).
            </Typography>
          )}
          {mpInfo?.configurado && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Pref: {mpInfo.preferenceId}
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  )
}

export function validarCobroMedio({ medio, monto, pagoExacto, montoRecibido, comprobante }) {
  const total = Number(monto) || 0
  if (medio === 'EFECTIVO' && !pagoExacto) {
    const rec = Number(montoRecibido)
    if (!Number.isFinite(rec) || rec < total) {
      return `El monto recibido debe ser al menos ${formatMoney(total)}`
    }
  }
  if (medio === 'TRANSFERENCIA' && !String(comprobante || '').trim()) {
    return 'Ingresá el N° o referencia del comprobante'
  }
  return null
}

export function buildCobroBody({ medio, monto, pagoExacto, montoRecibido, comprobante, mpInfo }) {
  const body = { medioPago: medio }
  if (medio === 'EFECTIVO') {
    body.montoRecibido = pagoExacto ? Number(monto) : Number(montoRecibido)
  }
  if ((medio === 'TRANSFERENCIA' || medio === 'QR') && String(comprobante || '').trim()) {
    body.referenciaComprobante = String(comprobante).trim()
  }
  if (mpInfo?.preferenceId) {
    body.mercadopagoId = mpInfo.preferenceId
  }
  return body
}

export { formatMoney, MEDIOS as MEDIOS_COBRO }
