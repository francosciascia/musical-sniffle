import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import { homePathForRol } from '../utils/auth'
import api from '../api/client'

/**
 * Una "página" = un componente que ocupa una ruta.
 * LoginPage vive en /login
 *
 * Flujo:
 * 1. El usuario escribe email y password
 * 2. Mandamos POST /api/auth/login con Axios
 * 3. Guardamos el token en localStorage
 * 4. Navegamos al mapa
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@musicalsniffle.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    // Evita que el form recargue toda la página (comportamiento HTML clásico)
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
      const message = err.response?.data?.error || 'No se pudo iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Musical Sniffle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ingresá con tu cuenta
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
