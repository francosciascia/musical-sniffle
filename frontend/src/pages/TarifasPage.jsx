import { Navigate } from 'react-router-dom'

/** Legacy URL → Configuración / Tarifas */
export default function TarifasPage() {
  return <Navigate to="/config?tab=tarifas" replace />
}
