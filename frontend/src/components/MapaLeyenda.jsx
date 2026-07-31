import { Box, Chip, Stack } from '@mui/material'

const ITEMS = [
  { color: '#66bb6a', label: 'Libre' },
  { color: '#ff9800', label: 'Reservada' },
  { color: '#ef5350', label: 'Ocupada' },
  { color: '#bdbdbd', label: 'Inactiva' },
]

export default function MapaLeyenda({ piso, libres, reservadas, ocupadas, inactivas, totalEdificio }) {
  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {ITEMS.map((item) => (
          <Chip
            key={item.label}
            size="small"
            label={item.label}
            sx={{
              bgcolor: item.color,
              color: '#fff',
              fontWeight: 600,
            }}
          />
        ))}
      </Stack>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip variant="outlined" label={`Piso ${piso}: ${libres + reservadas + ocupadas + inactivas} plazas`} />
        <Chip variant="outlined" color="success" label={`Libres ${libres}`} />
        <Chip variant="outlined" color="warning" label={`Reservadas ${reservadas}`} />
        <Chip variant="outlined" color="error" label={`Ocupadas ${ocupadas}`} />
        {inactivas > 0 && (
          <Chip variant="outlined" label={`Inactivas ${inactivas}`} />
        )}
        {totalEdificio != null && (
          <Chip variant="outlined" label={`Total edificio: ${totalEdificio} plazas`} />
        )}
      </Box>
    </Stack>
  )
}
