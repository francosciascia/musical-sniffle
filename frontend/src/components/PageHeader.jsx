import { Box, Stack, Typography } from '@mui/material'

/** Título de página operativa: tipografía de marca + subtítulo opcional + acciones. */
export default function PageHeader({ title, subtitle, actions, sx }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      justifyContent="space-between"
      sx={{ mb: 2, ...sx }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: '"Oswald", "Inter", sans-serif',
            fontWeight: 600,
            fontSize: { xs: '1.35rem', sm: '1.55rem' },
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
