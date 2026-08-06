import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import LoginPage from './pages/LoginPage'
import MapaPage from './pages/MapaPage'
import DashboardPage from './pages/DashboardPage'
import EstadiasPage from './pages/EstadiasPage'
import TarifasPage from './pages/TarifasPage'
import ReservasPage from './pages/ReservasPage'
import HistorialPage from './pages/HistorialPage'
import MapaEditorPage from './pages/MapaEditorPage'
import ConfigPage from './pages/ConfigPage'
import ClientesPage from './pages/ClientesPage'
import { getRol, homePathForRol, ensureValidSession } from './utils/auth'
import { appTheme } from './theme/theme'

const STAFF = ['USUARIO', 'ADMINISTRADOR']
const ADMIN = ['ADMINISTRADOR']

function RoleRoute({ roles, children }) {
  if (!ensureValidSession()) return <Navigate to="/login" replace />
  const rol = getRol()
  if (roles && !roles.includes(rol)) {
    return <Navigate to={homePathForRol(rol)} replace />
  }
  return children
}

function HomeRedirect() {
  if (!ensureValidSession()) return <Navigate to="/login" replace />
  return <Navigate to={homePathForRol(getRol())} replace />
}

function LoginRoute() {
  if (ensureValidSession()) {
    return <Navigate to={homePathForRol(getRol())} replace />
  }
  return <LoginPage />
}

export default function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/mapa"
            element={
              <RoleRoute roles={STAFF}>
                <MapaPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleRoute roles={STAFF}>
                <DashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/estadias"
            element={
              <RoleRoute roles={STAFF}>
                <EstadiasPage />
              </RoleRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <RoleRoute roles={STAFF}>
                <HistorialPage />
              </RoleRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <RoleRoute roles={ADMIN}>
                <ClientesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/config"
            element={
              <RoleRoute roles={ADMIN}>
                <ConfigPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tarifas"
            element={
              <RoleRoute roles={ADMIN}>
                <TarifasPage />
              </RoleRoute>
            }
          />
          <Route
            path="/reservas"
            element={
              <RoleRoute roles={ADMIN}>
                <ReservasPage />
              </RoleRoute>
            }
          />
          <Route path="/cobros" element={<Navigate to="/reservas?tab=cobrar" replace />} />
          <Route
            path="/diseno-mapa"
            element={
              <RoleRoute roles={ADMIN}>
                <MapaEditorPage />
              </RoleRoute>
            }
          />

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
