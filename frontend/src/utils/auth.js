const LEGACY_ROLES = {
  OPERADOR: 'USUARIO',
  SUPER_ADMIN: 'ADMINISTRADOR',
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getRol() {
  const raw = localStorage.getItem('rol')
  const mapped = LEGACY_ROLES[raw] || raw
  if (mapped !== raw && mapped) {
    localStorage.setItem('rol', mapped)
  }
  return mapped
}

export function getNombre() {
  return localStorage.getItem('nombre') || 'Usuario'
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('rol')
  localStorage.removeItem('nombre')
}

export function homePathForRol() {
  return '/mapa'
}

/** Personal de operación (usuario) o administrador. */
export function isStaff(rol = getRol()) {
  return rol === 'USUARIO' || rol === 'ADMINISTRADOR'
}

/** @deprecated usar isStaff */
export function isOperador(rol) {
  return isStaff(rol)
}

export function isAdmin(rol = getRol()) {
  return rol === 'ADMINISTRADOR'
}

/** Si el rol guardado no sirve para entrar, limpiar sesión. */
export function ensureValidSession() {
  if (!getToken()) return false
  if (!isStaff(getRol())) {
    logout()
    return false
  }
  return true
}
