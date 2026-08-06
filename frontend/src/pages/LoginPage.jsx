import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { LogIn, ParkingSquare } from 'lucide-react'
import { homePathForRol } from '../utils/auth'
import api from '../api/client'
import { colors } from '../theme/colors'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@musicalsniffle.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('rol', data.rol)
      localStorage.setItem('nombre', `${data.nombre} ${data.apellido}`)
      navigate(homePathForRol(data.rol))
    } catch (err) {
      let message = 'No se pudo iniciar sesión'
      if (err.response?.data?.error) {
        message = err.response.data.error
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        message =
          'No se pudo conectar al backend. Verificá que esté corriendo en http://localhost:8080'
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            bgcolor: colors.primary,
            color: '#fff',
            borderBottom: `3px solid ${colors.accent}`,
            px: 2.5,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <ParkingSquare size={22} strokeWidth={2.25} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
                Musical Sniffle
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', opacity: 0.85 }}>
                Gestión de estacionamiento
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Acceso para personal (usuario o administrador). Los clientes no inician sesión.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={1.5}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={<LogIn size={16} />}
              sx={{ mt: 0.5 }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
