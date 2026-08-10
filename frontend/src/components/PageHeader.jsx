import { Box, Stack, Typography } from '@mui/material'

/** Título de página operativa: tipografía de marca + subtítulo opcional + acciones a la derecha. */
export default function PageHeader({ title, subtitle, actions, sx }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      sx={{ mb: 2, width: '100%', ...sx }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
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
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent="flex-end"
          sx={{ flexShrink: 0, ml: { sm: 'auto' } }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
