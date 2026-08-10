import { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Car,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ParkingSquare,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { getNombre, getRol, isAdmin, isOperador, logout as clearAuth } from '../utils/auth'
import { colors } from '../theme/colors'

function buildNavItems(rol) {
  const items = []
  if (isOperador(rol)) {
    items.push(
      { to: '/mapa', label: 'Mapa', icon: Map },
      { to: '/estadias', label: 'Estadías', icon: Car },
      { to: '/historial', label: 'Historial', icon: History },
    )
  }
  if (isAdmin(rol)) {
    items.push(
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/reservas', label: 'Abonos', icon: ClipboardList },
      { to: '/config', label: 'Configuración', icon: Settings },
    )
  }
  if (isOperador(rol)) {
    items.push({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard })
  }
  return items
}

function NavItem({ to, icon: Icon, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to || (to === '/config' && location.pathname.startsWith('/config'))
  return (
    <Button
      component={RouterLink}
      to={to}
      onClick={onClick}
      startIcon={<Icon size={16} strokeWidth={2} />}
      sx={{
        color: active ? colors.accent : 'rgba(255,255,255,0.85)',
        bgcolor: active ? 'rgba(0,0,0,0.18)' : 'transparent',
        borderRadius: '6px',
        px: 1.25,
        py: 0.5,
        minHeight: 32,
        fontWeight: active ? 700 : 500,
        whiteSpace: 'nowrap',
        '&:hover': {
          bgcolor: 'rgba(0,0,0,0.22)',
          color: '#fff',
        },
      }}
    >
      {children}
    </Button>
  )
}

/** variant="ops" = pantalla completa (mapa), sin card envolvente. */
export default function AppLayout({ children, variant = 'page', maxWidth = 1200 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const rol = getRol()
  const nombre = getNombre()
  const isOps = variant === 'ops'
  const navItems = buildNavItems(rol)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  function closeDrawer() {
    setDrawerOpen(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: isOps ? '100dvh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: isOps ? 'hidden' : 'visible',
      }}
    >
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          bgcolor: colors.primary,
          color: '#fff',
          borderBottom: `3px solid ${colors.accent}`,
          px: { xs: 1, sm: 2 },
          py: 0.75,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} useFlexGap>
          {isMobile && (
            <IconButton
              aria-label="Menú"
              onClick={() => setDrawerOpen(true)}
              sx={{ color: '#fff', p: 0.75 }}
            >
              <Menu size={22} />
            </IconButton>
          )}

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0, flex: isMobile ? 1 : 'none', mr: isMobile ? 0 : 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '4px',
                bgcolor: colors.accent,
                color: colors.primaryDark,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ParkingSquare size={16} strokeWidth={2.5} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: '"Oswald", "Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  lineHeight: 1.1,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
                noWrap
              >
                Musical Sniffle
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', opacity: 0.8, lineHeight: 1.2 }} noWrap>
                {nombre}
              </Typography>
            </Box>
          </Stack>

          {!isMobile && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
              {navItems.map((item) => (
                <NavItem key={item.to} to={item.to} icon={item.icon}>
                  {item.label}
                </NavItem>
              ))}
            </Stack>
          )}

          <Button
            onClick={handleLogout}
            startIcon={<LogOut size={16} />}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              minHeight: 32,
              px: { xs: 1, sm: 1.5 },
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '6px',
              '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } },
              '&:hover': { bgcolor: 'rgba(0,0,0,0.2)', color: '#fff' },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Salir
            </Box>
          </Button>
        </Stack>
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: { xs: '86vw', sm: 300 },
            maxWidth: 320,
            bgcolor: colors.primary,
            color: '#fff',
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1.25 }}>
          <Typography sx={{ fontWeight: 700 }}>Menú</Typography>
          <IconButton onClick={closeDrawer} sx={{ color: '#fff' }} aria-label="Cerrar">
            <X size={20} />
          </IconButton>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
        <List sx={{ py: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              location.pathname === item.to ||
              (item.to === '/config' && location.pathname.startsWith('/config'))
            return (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={closeDrawer}
                selected={active}
                sx={{
                  mx: 1,
                  borderRadius: '6px',
                  mb: 0.25,
                  color: active ? colors.accent : 'rgba(255,255,255,0.9)',
                  '&.Mui-selected': { bgcolor: 'rgba(0,0,0,0.22)' },
                  '&.Mui-selected:hover': { bgcolor: 'rgba(0,0,0,0.28)' },
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.18)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                  <Icon size={18} />
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />
              </ListItemButton>
            )
          })}
        </List>
        <Box sx={{ flex: 1 }} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            onClick={() => {
              closeDrawer()
              handleLogout()
            }}
            startIcon={<LogOut size={16} />}
            sx={{
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '6px',
            }}
          >
            Salir
          </Button>
        </Box>
      </Drawer>

      {isOps ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
          }}
        >
          {children}
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2.25 },
            maxWidth: maxWidth === 'xl' ? 1400 : maxWidth,
            width: '100%',
            mx: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}
