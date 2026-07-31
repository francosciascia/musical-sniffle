export function getToken() {
  return localStorage.getItem('token')
}

export function getRol() {
  return localStorage.getItem('rol')
}

export function getNombre() {
  return localStorage.getItem('nombre') || 'Usuario'
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('rol')
  localStorage.removeItem('nombre')
}

export function homePathForRol(rol) {
  if (rol === 'CLIENTE') return '/mis-autos'
  return '/mapa'
}

export function isOperador(rol) {
  return rol === 'OPERADOR' || rol === 'SUPER_ADMIN'
}

export function isAdmin(rol) {
  return rol === 'SUPER_ADMIN'
}
