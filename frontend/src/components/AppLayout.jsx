import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { getNombre, getRol, isAdmin, isOperador, logout as clearAuth } from '../utils/auth'

function NavButton({ to, children }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Button
      color="inherit"
      component={RouterLink}
      to={to}
      sx={{ opacity: active ? 1 : 0.75, fontWeight: active ? 700 : 400 }}
    >
      {children}
    </Button>
  )
}

export default function AppLayout({ children, maxWidth = 'lg' }) {
  const navigate = useNavigate()
  const rol = getRol()
  const nombre = getNombre()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, minWidth: 180 }}>
            Musical Sniffle — {nombre}
          </Typography>

          {isOperador(rol) && (
            <>
              <NavButton to="/mapa">Mapa</NavButton>
              <NavButton to="/estadias">Estadías</NavButton>
              <NavButton to="/historial">Historial</NavButton>
            </>
          )}

          {isAdmin(rol) && (
            <>
              <NavButton to="/diseno-mapa">Diseñar mapa</NavButton>
              <NavButton to="/tarifas">Tarifas</NavButton>
              <NavButton to="/reservas">Reservas</NavButton>
            </>
          )}

          {rol === 'CLIENTE' && (
            <>
              <NavButton to="/mis-autos">Mis autos</NavButton>
              <NavButton to="/mi-reserva">Mi reserva</NavButton>
            </>
          )}

          <Button color="inherit" onClick={handleLogout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}
