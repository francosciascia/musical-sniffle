import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import LoginPage from './pages/LoginPage'
import MapaPage from './pages/MapaPage'
import DashboardPage from './pages/DashboardPage'
import EstadiasPage from './pages/EstadiasPage'
import TarifasPage from './pages/TarifasPage'
import ReservasPage from './pages/ReservasPage'
import HistorialPage from './pages/HistorialPage'
import MisAutosPage from './pages/MisAutosPage'
import MiReservaPage from './pages/MiReservaPage'
import MapaEditorPage from './pages/MapaEditorPage'
import ConfigPage from './pages/ConfigPage'
import ClientesPage from './pages/ClientesPage'
import { getRol, getToken, homePathForRol } from './utils/auth'
import { appTheme } from './theme/theme'

function RoleRoute({ roles, children }) {
  if (!getToken()) return <Navigate to="/login" replace />
  const rol = getRol()
  if (roles && !roles.includes(rol)) {
    return <Navigate to={homePathForRol(rol)} replace />
  }
  return children
}

function HomeRedirect() {
  const rol = getRol()
  if (!getToken()) return <Navigate to="/login" replace />
  return <Navigate to={homePathForRol(rol)} replace />
}

export default function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/mapa"
            element={
              <RoleRoute roles={['OPERADOR', 'SUPER_ADMIN']}>
                <MapaPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleRoute roles={['OPERADOR', 'SUPER_ADMIN']}>
                <DashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/estadias"
            element={
              <RoleRoute roles={['OPERADOR', 'SUPER_ADMIN']}>
                <EstadiasPage />
              </RoleRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <RoleRoute roles={['OPERADOR', 'SUPER_ADMIN']}>
                <HistorialPage />
              </RoleRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <ClientesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/config"
            element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <ConfigPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tarifas"
            element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <TarifasPage />
              </RoleRoute>
            }
          />
          <Route
            path="/reservas"
            element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <ReservasPage />
              </RoleRoute>
            }
          />
          <Route
            path="/diseno-mapa"
            element={
              <RoleRoute roles={['SUPER_ADMIN']}>
                <MapaEditorPage />
              </RoleRoute>
            }
          />
          <Route
            path="/mis-autos"
            element={
              <RoleRoute roles={['CLIENTE']}>
                <MisAutosPage />
              </RoleRoute>
            }
          />
          <Route
            path="/mi-reserva"
            element={
              <RoleRoute roles={['CLIENTE']}>
                <MiReservaPage />
              </RoleRoute>
            }
          />

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
