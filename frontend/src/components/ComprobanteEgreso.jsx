import { Box, Typography } from '@mui/material'
import { colors } from '../theme/colors'
import { labelMedioPago } from '../utils/mediosPago'

function formatFecha(value) {
  if (!value) return '—'
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

/** Comprobante chiquito de egreso / cobro. */
export default function ComprobanteEgreso({ cobro }) {
  if (!cobro) return null

  return (
    <Box
      className="ticket-slip"
      sx={{
        width: 220,
        mx: 'auto',
        px: 1.5,
        py: 1.5,
        bgcolor: '#fff',
        color: '#111',
        border: `1px dashed ${colors.border}`,
        borderRadius: '6px',
        fontFamily: '"Roboto Mono", ui-monospace, monospace',
      }}
    >
      <Typography align="center" sx={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em' }}>
        MUSICAL SNIFFLE
      </Typography>
      <Typography align="center" sx={{ fontSize: '0.65rem', color: colors.cementDark, mb: 1 }}>
        COMPROBANTE DE EGRESO
      </Typography>

      <Box sx={{ borderTop: '1px dashed #bbb', borderBottom: '1px dashed #bbb', py: 1, mb: 1 }}>
        <Typography align="center" sx={{ fontSize: '0.65rem' }}>
          TICKET
        </Typography>
        <Typography align="center" className="mono" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
          {cobro.ticketCodigo}
        </Typography>
      </Box>

      <Row label="Patente" value={cobro.patente} strong />
      <Row label="Plaza" value={cobro.plazaCodigo || 'Sin asignar'} />
      <Row label="Tipo" value={cobro.tipoVehiculo} />
      <Row label="Ingreso" value={formatFecha(cobro.entrada)} />
      <Row label="Salida" value={formatFecha(cobro.salida)} />
      <Row label="Pago" value={labelMedioPago(cobro.medioPago)} />

      <Box sx={{ borderTop: '1px dashed #bbb', mt: 1, pt: 1 }}>
        <Typography align="center" sx={{ fontSize: '0.65rem', color: colors.cementDark }}>
          TOTAL
        </Typography>
        <Typography align="center" className="mono" sx={{ fontWeight: 800, fontSize: '1.2rem' }}>
          {cobro.abonado || Number(cobro.monto) === 0
            ? 'SIN CARGO'
            : `$${Number(cobro.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
        </Typography>
      </Box>

      <Typography align="center" sx={{ mt: 1.25, fontSize: '0.6rem', color: colors.cementDark }}>
        Gracias por su visita.
      </Typography>
    </Box>
  )
}

function Row({ label, value, strong }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.35, fontSize: '0.72rem' }}>
      <Box component="span" sx={{ color: colors.cementDark }}>
        {label}
      </Box>
      <Box component="span" className="mono" sx={{ fontWeight: strong ? 800 : 600, textAlign: 'right' }}>
        {value}
      </Box>
    </Box>
  )
}
