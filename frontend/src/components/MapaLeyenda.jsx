import { Box, Stack, Typography } from '@mui/material'
import { LEYENDA_PLAZAS } from '../theme/colors'

const LABELS_CON_COUNT = new Set(['Libre', 'Reservada', 'Ocupada', 'Fuera de servicio'])

/**
 * @param {'row' | 'compact'} variant
 * row = horizontal (páginas); compact = vertical con conteos (panel mapa)
 */
export default function MapaLeyenda({
  libres,
  reservadas,
  ocupadas,
  inactivas,
  variant = 'row',
  showMotoParcial = true,
}) {
  const counts = {
    Libre: libres,
    Reservada: reservadas,
    Ocupada: ocupadas,
    'Fuera de servicio': inactivas,
  }

  const items = LEYENDA_PLAZAS.filter(
    (item) => showMotoParcial || item.label !== '1 moto (cabe otra)',
  )

  if (variant === 'compact') {
    return (
      <Stack spacing={0.45}>
        {items.map((item) => (
          <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '2px',
                bgcolor: item.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }} noWrap>
              {item.label}
            </Typography>
            {LABELS_CON_COUNT.has(item.label) && counts[item.label] != null && (
              <Typography variant="caption" className="mono" sx={{ fontWeight: 700 }}>
                {counts[item.label]}
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>
    )
  }

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {items.map((item) => (
        <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              bgcolor: item.color,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {item.label}
            {counts[item.label] != null ? ` ${counts[item.label]}` : ''}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
