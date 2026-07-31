import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  Paper,
  Typography,
} from '@mui/material'
import AppLayout from '../components/AppLayout'
import api from '../api/client'

function estadoColor(estado) {
  if (estado === 'ACTIVA') return 'success'
  if (estado === 'CANCELADA' || estado === 'VENCIDA') return 'default'
  return 'warning'
}

export default function MiReservaPage() {
  const [reserva, setReserva] = useState(null)
  const [sinReserva, setSinReserva] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const { data } = await api.get('/cliente/mi-reserva')
        setReserva(data)
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message
        if (err.response?.status === 400 || msg?.includes('no tiene reserva')) {
          setSinReserva(true)
        } else {
          setError(msg || 'No se pudo cargar tu reserva')
        }
      }
    }
    cargar()
  }, [])

  return (
    <AppLayout>
      <Typography variant="h5" gutterBottom>
        Mi reserva mensual
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {sinReserva && (
        <Alert severity="info">
          No tenés una reserva activa. Contactá al administrador del estacionamiento para contratar un abono.
        </Alert>
      )}

      {reserva && (
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Box sx={{ mb: 2 }}>
            <Chip label={reserva.estado} color={estadoColor(reserva.estado)} />
          </Box>
          <Typography><strong>Plaza:</strong> {reserva.plazaCodigo}</Typography>
          <Typography><strong>Patentes:</strong> {reserva.patentes?.join(', ')}</Typography>
          <Typography><strong>Desde:</strong> {reserva.fechaInicio}</Typography>
          <Typography><strong>Hasta:</strong> {reserva.fechaFin || 'Indefinida'}</Typography>
          <Typography><strong>Monto mensual:</strong> ${reserva.montoMensual}</Typography>
        </Paper>
      )}
    </AppLayout>
  )
}
