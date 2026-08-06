/** Paleta operativa — señalización / industrial */

export const colors = {
  background: '#F2F0EB',
  surface: '#FAF9F6',
  surfaceAlt: '#E8E6E1',
  cement: '#6E6E6E',
  cementDark: '#4A4A4A',
  border: '#D4D1CA',

  primary: '#0B5D2A',
  primaryDark: '#084720',
  primaryLight: '#147A3A',
  accent: '#F5C400',
  accentDark: '#C9A000',

  libre: '#1B7A3A',
  reservada: '#E68A00',
  ocupada: '#C62828',
  /** Una moto y cabe otra (si la regla está activa). */
  parcialMoto: '#EF6C00',
  fueraServicio: '#8A8A8A',

  mapCanvas: '#FAF9F6',
  mapGrid: '#D4D1CA',
  mapText: '#FFFFFF',
  mapTextMuted: '#6E6E6E',
  mapStroke: '#3A3A3A',

  formaContorno: '#D4D1CA',
  formaObstaculo: '#6E6E6E',
}

export function plazaFill(plaza, selected = false) {
  if (!plaza.activa) return colors.fueraServicio
  if (plaza.ocupada) return colors.ocupada
  if (plaza.puedeOtraMoto) return colors.parcialMoto
  if (plaza.reservada) return colors.reservada
  if (selected) return colors.primaryLight
  return colors.libre
}

export function plazaStroke(plaza, selected = false) {
  if (selected) return colors.accent
  if (!plaza.activa) return colors.cement
  if (plaza.ocupada) return '#8E1B1B'
  if (plaza.puedeOtraMoto) return '#BF360C'
  if (plaza.reservada) return '#B86E00'
  return colors.primaryDark
}

export const LEYENDA_PLAZAS = [
  { color: colors.libre, label: 'Libre' },
  { color: colors.reservada, label: 'Reservada' },
  { color: colors.parcialMoto, label: '1 moto (cabe otra)' },
  { color: colors.ocupada, label: 'Ocupada' },
  { color: colors.fueraServicio, label: 'Fuera de servicio' },
]
