/** Primera letra de cada palabra en mayúscula. Ej: "juan CARLOS" → "Juan Carlos" */
export function capitalizarNombre(value) {
  if (value == null) return value
  const trimmed = String(value).trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed
  return trimmed
    .split(' ')
    .map((w) => w.charAt(0).toLocaleUpperCase('es') + w.slice(1).toLocaleLowerCase('es'))
    .join(' ')
}
