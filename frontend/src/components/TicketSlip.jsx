import { Box, Typography } from '@mui/material'
import { colors } from '../theme/colors'

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

/**
 * Ticket térmico chiquito (≈58 mm). Clase .ticket-slip para impresión.
 */
export default function TicketSlip({ ticket }) {
  if (!ticket) return null

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
      <Typography
        align="center"
        sx={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em', lineHeight: 1.2 }}
      >
        MUSICAL SNIFFLE
      </Typography>
      <Typography
        align="center"
        sx={{ fontSize: '0.65rem', color: colors.cementDark, mb: 1 }}
      >
        ESTACIONAMIENTO
      </Typography>

      <Box sx={{ borderTop: '1px dashed #bbb', borderBottom: '1px dashed #bbb', py: 1, mb: 1 }}>
        <Typography align="center" sx={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          TICKET
        </Typography>
        <Typography
          align="center"
          className="mono"
          sx={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.06em' }}
        >
          {ticket.codigo}
        </Typography>
      </Box>

      <Row label="Patente" value={ticket.patente} strong />
      <Row label="Plaza" value={ticket.plazaCodigo || 'Sin asignar'} />
      <Row label="Ingreso" value={formatFecha(ticket.emitidoEn)} />
      {ticket.abonado && <Row label="Tipo" value="Abonado" />}
      {ticket.clienteNombre && <Row label="Cliente" value={ticket.clienteNombre} />}

      <Typography
        align="center"
        sx={{ mt: 1.25, fontSize: '0.6rem', color: colors.cementDark, lineHeight: 1.35 }}
      >
        Conservá este ticket para el egreso.
        <br />
        Gracias por su visita.
      </Typography>
    </Box>
  )
}

function Row({ label, value, strong }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 1,
        py: 0.35,
        fontSize: '0.72rem',
      }}
    >
      <Box component="span" sx={{ color: colors.cementDark }}>
        {label}
      </Box>
      <Box
        component="span"
        className="mono"
        sx={{ fontWeight: strong ? 800 : 600, textAlign: 'right' }}
      >
        {value}
      </Box>
    </Box>
  )
}
