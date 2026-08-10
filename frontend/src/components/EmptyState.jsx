import { Box, Button, Typography } from '@mui/material'
import { colors } from '../theme/colors'

/** Empty state corto: una línea + acción opcional. */
export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <Box
      sx={{
        py: 4,
        px: 2,
        textAlign: 'center',
        border: `1px dashed ${colors.border}`,
        borderRadius: '6px',
        bgcolor: colors.surface,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: onAction ? 1.5 : 0 }}>
        {message}
      </Typography>
      {onAction && actionLabel && (
        <Button variant="contained" size="small" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
