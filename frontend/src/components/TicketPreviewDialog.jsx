import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material'
import { Printer } from 'lucide-react'
import TicketSlip from './TicketSlip'

export default function TicketPreviewDialog({ open, ticket, onClose }) {
  function handlePrint() {
    window.print()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      className="ticket-dialog"
      PaperProps={{
        className: 'ticket-dialog-paper',
        sx: { bgcolor: 'background.paper' },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Ticket emitido</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} alignItems="center">
          <Box className="ticket-print-root">
            <TicketSlip ticket={ticket} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }} className="no-print">
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<Printer size={16} />} onClick={handlePrint}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  )
}
