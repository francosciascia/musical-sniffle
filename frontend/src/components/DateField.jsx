import TextField from '@mui/material/TextField'

const dateInputSx = {
  minWidth: 200,
  '& input': {
    minWidth: 168,
    lineHeight: 1.4375,
  },
  '& input::-webkit-datetime-edit': {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
  },
  '& input::-webkit-datetime-edit-fields-wrapper': {
    display: 'inline-flex',
  },
  '& input::-webkit-datetime-edit-text': {
    padding: '0 2px',
  },
  '& input::-webkit-calendar-picker-indicator': {
    cursor: 'pointer',
    opacity: 0.7,
  },
}

/**
 * Fecha nativa sin el “dd/mm/aaaa” apilado de Chrome/Edge cuando está vacío.
 */
export default function DateField({ value = '', sx, slotProps, InputLabelProps, ...props }) {
  const empty = !value
  return (
    <TextField
      type="date"
      value={value}
      className={empty ? 'date-field-empty' : undefined}
      slotProps={{
        ...slotProps,
        inputLabel: { shrink: true, ...slotProps?.inputLabel },
      }}
      sx={{ ...dateInputSx, ...sx }}
      {...props}
    />
  )
}
