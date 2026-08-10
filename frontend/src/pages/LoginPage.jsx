import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { LogIn } from 'lucide-react'
import { homePathForRol } from '../utils/auth'
import api from '../api/client'
import { colors } from '../theme/colors'
import heroImg from '../assets/hero.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@musicalsniffle.com')
  const [password, setPassword] = useState('')
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
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
        bgcolor: colors.primaryDark,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '42dvh', md: '100dvh' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: { xs: 2.5, md: 4 },
        }}
      >
        <Box
          component="img"
          src={heroImg}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8,71,32,0.25) 0%, rgba(8,71,32,0.55) 45%, rgba(8,71,32,0.92) 100%)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <Typography
            sx={{
              fontFamily: '"Oswald", "Inter", sans-serif',
              fontWeight: 700,
              fontSize: { xs: '2.6rem', md: '3.75rem' },
              lineHeight: 0.95,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: '#fff',
              mb: 1,
            }}
          >
            Musical Sniffle
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              maxWidth: 360,
              lineHeight: 1.45,
            }}
          >
            Operación del estacionamiento: mapa, ingresos, egresos y abonos.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: colors.background,
          p: { xs: 2.5, md: 4 },
          borderTop: { xs: `3px solid ${colors.accent}`, md: 'none' },
          borderLeft: { md: `3px solid ${colors.accent}` },
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 360 }}>
          <Typography
            sx={{
              fontFamily: '"Oswald", "Inter", sans-serif',
              fontWeight: 600,
              fontSize: '1.35rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            Entrar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Acceso para personal. Los clientes no inician sesión.
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
              autoComplete="username"
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={<LogIn size={18} />}
              sx={{ mt: 0.5, minHeight: 44, fontSize: '0.9rem' }}
            >
              {loading ? 'Entrando…' : 'Entrar al mapa'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
