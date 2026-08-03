import { Box, Stack, Typography } from '@mui/material'
import { LEYENDA_PLAZAS } from '../theme/colors'

export default function MapaLeyenda({ libres, reservadas, ocupadas, inactivas }) {
  const counts = {
    Libre: libres,
    Reservada: reservadas,
    Ocupada: ocupadas,
    'Fuera de servicio': inactivas,
  }

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
      {LEYENDA_PLAZAS.map((item) => (
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
