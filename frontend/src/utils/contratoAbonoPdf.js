import { jsPDF } from 'jspdf'

function money(n) {
  if (n == null || n === '') return '—'
  return `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fechaLarga(iso) {
  if (!iso) return '—'
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * Genera un PDF de contrato de abono mensual (plaza fija),
 * inspirado en modelos de locación de cochera / estacionamiento.
 *
 * @param {object} opts
 * @param {object} opts.reserva - respuesta API
 * @param {object} [opts.cliente] - ficha cliente (dni, email, telefono, nombre, apellido)
 * @param {string} [opts.estacionamientoNombre]
 * @param {string} [opts.estacionamientoDomicilio]
 */
export function downloadContratoAbonoPdf({
  reserva,
  cliente,
  estacionamientoNombre = 'Musical Sniffle',
  estacionamientoDomicilio = 'Estacionamiento — domicilio a completar',
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 18
  const pageW = doc.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = 18

  const line = (text, opts = {}) => {
    const {
      size = 10,
      bold = false,
      indent = 0,
      gap = 5,
      align = 'left',
    } = opts
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(String(text), maxW - indent)
    for (const l of lines) {
      if (y > 275) {
        doc.addPage()
        y = 18
      }
      doc.text(l, align === 'center' ? pageW / 2 : margin + indent, y, {
        align: align === 'center' ? 'center' : 'left',
      })
      y += gap
    }
  }

  const clienteNombre =
    cliente?.nombre && cliente?.apellido
      ? `${cliente.nombre} ${cliente.apellido}`
      : reserva.clienteNombre || '—'
  const dni = cliente?.dni || '………………'
  const email = cliente?.email || '………………'
  const telefono = cliente?.telefono || '………………'
  const plaza = reserva.plazaCodigo || '—'
  const patentes = (reserva.patentes || []).join(', ') || '—'
  const monto = money(reserva.montoMensual)
  const desde = fechaLarga(reserva.fechaInicio)
  const hasta = reserva.fechaFin ? fechaLarga(reserva.fechaFin) : 'plazo indeterminado (renovable mes a mes)'
  const hoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Encabezado
  doc.setFillColor(11, 93, 42)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(estacionamientoNombre.toUpperCase(), pageW / 2, 12, { align: 'center' })
  doc.setFontSize(11)
  doc.text('CONTRATO DE ABONO MENSUAL — PLAZA FIJA', pageW / 2, 20, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y = 36

  line(`Lugar y fecha: ${estacionamientoDomicilio}, ${hoy}.`, { size: 9, gap: 7 })

  line(
    `Entre ${estacionamientoNombre}, en adelante el ESTACIONAMIENTO o LOCADOR, y el/la Sr./Sra. ${clienteNombre}, DNI Nº ${dni}, teléfono ${telefono}, correo electrónico ${email}, en adelante el/la CLIENTE o LOCATARIO/A, se conviene celebrar el presente contrato de abono mensual de estacionamiento (locación de uso de plaza fija), sujeto a las siguientes cláusulas:`,
    { size: 9.5, gap: 4.5 },
  )
  y += 2

  line('CLÁUSULA PRIMERA — Objeto', { bold: true, size: 10, gap: 5 })
  line(
    `El ESTACIONAMIENTO cede al CLIENTE el uso exclusivo de la plaza de estacionamiento fija identificada como «${plaza}», destinada únicamente al guardado de vehículo/s. Vehículo/s autorizado/s (dominio/patente): ${patentes}. Queda prohibido el uso de la plaza para otro destino o para vehículos no registrados, salvo autorización escrita del ESTACIONAMIENTO.`,
    { size: 9.5, gap: 4.5 },
  )
  y += 1

  line('CLÁUSULA SEGUNDA — Plazo', { bold: true, size: 10, gap: 5 })
  line(
    `El abono rige desde el ${desde} hasta ${hasta}. Vencido el plazo, podrá renovarse de común acuerdo. Si no hubiera renovación ni pago, el ESTACIONAMIENTO podrá liberar la plaza y dar por finalizado el abono conforme a sus reglas operativas (aviso, gracia y/o suspensión).`,
    { size: 9.5, gap: 4.5 },
  )
  y += 1

  line('CLÁUSULA TERCERA — Canon mensual', { bold: true, size: 10, gap: 5 })
  line(
    `Las partes fijan el canon mensual en ${monto} (pesos argentinos). El pago se efectuará por mes adelantado, en la forma que indique el ESTACIONAMIENTO (efectivo, transferencia u otros medios habilitados). La falta de pago en término podrá generar intereses, suspensión del abono y/o pérdida del derecho a la plaza fija, sin perjuicio de las acciones legales correspondientes.`,
    { size: 9.5, gap: 4.5 },
  )
  y += 1

  line('CLÁUSULA CUARTA — Uso y obligaciones del cliente', { bold: true, size: 10, gap: 5 })
  line(
    'El CLIENTE se obliga a: (a) utilizar la plaza solo para los vehículos autorizados; (b) respetar la señalización, horarios y normas internas del predio; (c) no ceder ni sublocar la plaza; (d) comunicar de inmediato cualquier cambio de patente, datos personales o pérdida de medios de acceso; (e) retirar el vehículo al finalizar el contrato. El abonado no requiere ticket de ingreso/egreso de visitante: estaciona en su plaza asignada.',
    { size: 9.5, gap: 4.5 },
  )
  y += 1

  line('CLÁUSULA QUINTA — Obligaciones del estacionamiento', { bold: true, size: 10, gap: 5 })
  line(
    'El ESTACIONAMIENTO se obliga a mantener disponible la plaza asignada durante la vigencia del abono y el cumplimiento de pago, y a informar cambios relevantes de tarifas o reglamento con la antelación que corresponda. El servicio consiste en la cesión de uso de espacio; no implica depósito necesario ni guarda con obligación de resultado respecto del vehículo o sus efectos, salvo disposición legal imperativa en contrario.',
    { size: 9.5, gap: 4.5 },
  )
  y += 1

  line('CLÁUSULA SEXTA — Rescisión', { bold: true, size: 10, gap: 5 })
  line(
    'Cualquiera de las partes podrá rescindir el contrato comunicándolo con al menos 15 (quince) días de anticipación al vencimiento del período pago, salvo incumplimiento grave (falta de pago, uso indebido, etc.), en cuyo caso el ESTACIONAMIENTO podrá dar por extinguido el abono de inmediato y reclamar los importes adeudados.',
    { size: 9.5, gap: 4.5 },
  )
  y += 1

  line('CLÁUSULA SÉPTIMA — Aceptación', { bold: true, size: 10, gap: 5 })
  line(
    'Las partes declaran haber leído y aceptado íntegramente el presente contrato, firmando de conformidad en dos ejemplares de un mismo tenor y a un solo efecto.',
    { size: 9.5, gap: 4.5 },
  )

  y += 14
  if (y > 240) {
    doc.addPage()
    y = 30
  }

  const col1 = margin + 10
  const col2 = pageW / 2 + 10
  const signY = y

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.line(col1, signY, col1 + 60, signY)
  doc.line(col2, signY, col2 + 60, signY)
  doc.text('Firma del ESTACIONAMIENTO', col1, signY + 6)
  doc.text('Aclaración / DNI', col1, signY + 11)
  doc.text('Firma del CLIENTE', col2, signY + 6)
  doc.text('Aclaración / DNI', col2, signY + 11)

  y = signY + 28
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(
    `Documento generado por el sistema · Abono #${reserva.id ?? '—'} · Plaza ${plaza} · ${monto}/mes`,
    margin,
    y,
  )
  doc.setTextColor(0)

  const filename = `contrato-abono-${plaza}-${(reserva.clienteNombre || 'cliente').replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
