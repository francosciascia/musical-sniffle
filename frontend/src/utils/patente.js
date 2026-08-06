/** Patente informal: mínimo 3, máximo 8 (cubre ABC123 y AA123BB). */
export const PATENTE_MIN = 3
export const PATENTE_MAX = 8

/** Deja solo letras y números, en mayúsculas. */
export function normalizePatente(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function isPatenteValida(value) {
  const p = normalizePatente(value)
  return p.length >= PATENTE_MIN && p.length <= PATENTE_MAX
}

export function patenteHelperText(value) {
  const p = normalizePatente(value)
  if (!p) return `Mín. ${PATENTE_MIN} caracteres (ej. 123, ASD123, AA123BB)`
  if (p.length < PATENTE_MIN) return `Faltan ${PATENTE_MIN - p.length} (mínimo ${PATENTE_MIN})`
  if (p.length > PATENTE_MAX) return `Máximo ${PATENTE_MAX} caracteres`
  return 'Ok'
}
