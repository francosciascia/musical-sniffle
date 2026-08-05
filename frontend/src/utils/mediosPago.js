export const MEDIOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'QR', label: 'QR / Mercado Pago' },
  { value: 'OTRO', label: 'Otro' },
]

export function labelMedioPago(value) {
  if (!value) return '—'
  if (value === 'ABONADO') return 'Abonado'
  return MEDIOS_PAGO.find((m) => m.value === value)?.label || value
}
