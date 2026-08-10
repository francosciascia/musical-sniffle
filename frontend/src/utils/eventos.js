/** Etiquetas legibles para TipoEvento del historial. */
export const TIPOS_EVENTO = [
  { value: '', label: 'Todos' },
  { value: 'INGRESO', label: 'Ingresos' },
  { value: 'SALIDA', label: 'Egresos' },
  { value: 'PAGO', label: 'Pagos (estadía)' },
  { value: 'PAGO_MENSUAL', label: 'Pagos de abono' },
  { value: 'RESERVA_CREADA', label: 'Abono creado' },
  { value: 'RESERVA_ACTUALIZADA', label: 'Abono actualizado' },
  { value: 'RESERVA_CANCELADA', label: 'Abono cancelado' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'TARIFA_ACTUALIZADA', label: 'Tarifa' },
  { value: 'USUARIO_CREADO', label: 'Usuario creado' },
  { value: 'AUTO_REGISTRADO', label: 'Auto registrado' },
]

export function labelTipoEvento(value) {
  if (!value) return '—'
  return TIPOS_EVENTO.find((t) => t.value === value)?.label || value
}
