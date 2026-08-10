import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Download } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DateField from '../components/DateField'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import TablePager from '../components/TablePager'
import api from '../api/client'
import { usePagedRows } from '../hooks/usePagedRows'
import { getRol, isAdmin } from '../utils/auth'
import { downloadCsv } from '../utils/exportCsv'
import { labelMedioPago } from '../utils/mediosPago'
import { TIPOS_EVENTO, labelTipoEvento } from '../utils/eventos'
import { colors } from '../theme/colors'

export default function HistorialPage() {
  const rol = getRol()
  const admin = isAdmin(rol)
  const [eventos, setEventos] = useState([])
  const [totales, setTotales] = useState(null)
  const [error, setError] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tipo, setTipo] = useState('')

  const filtrados = useMemo(() => {
    if (!tipo) return eventos
    return eventos.filter((e) => e.tipoEvento === tipo)
  }, [eventos, tipo])

  const { page, rowsPerPage, setPage, setRowsPerPage, paged, count } = usePagedRows(filtrados, {
    resetKey: `${desde}|${hasta}|${tipo}`,
  })

  const cargar = useCallback(async () => {
    setError('')
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta

    try {
      const url = admin ? '/admin/historial' : '/operador/historial'
      const { data } = await api.get(url, { params })
      setEventos(data)

      if (admin) {
        const resTotal = await api.get('/admin/historial/total', { params })
        setTotales(resTotal.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el historial')
    }
  }, [admin, desde, hasta])

  useEffect(() => {
    cargar()
  }, [cargar])

  function exportHistorial() {
    downloadCsv(
      `historial_${desde || 'inicio'}_${hasta || 'hoy'}.csv`,
      ['Fecha', 'Evento', 'Descripcion', 'Usuario', 'Monto', 'MedioPago'],
      filtrados.map((e) => [
        e.fechaHora?.replace('T', ' ').slice(0, 19) || '',
        e.tipoEvento,
        e.descripcion,
        e.personaEmail || '',
        e.monto ?? '',
        e.medioPago || '',
      ]),
    )
  }

  function exportCaja() {
    const pagos = filtrados.filter((e) => e.tipoEvento === 'PAGO' || e.tipoEvento === 'PAGO_MENSUAL')
    downloadCsv(
      `caja_${desde || 'inicio'}_${hasta || 'hoy'}.csv`,
      ['Fecha', 'Tipo', 'Descripcion', 'Usuario', 'Monto', 'MedioPago'],
      pagos.map((e) => [
        e.fechaHora?.replace('T', ' ').slice(0, 19) || '',
        e.tipoEvento,
        e.descripcion,
        e.personaEmail || '',
        e.monto ?? '',
        labelMedioPago(e.medioPago),
      ]),
    )
  }

  return (
    <AppLayout maxWidth="xl">
      <PageHeader
        title="Historial"
        subtitle="Eventos del predio y movimientos de caja."
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={exportHistorial}
              disabled={!filtrados.length}
            >
              CSV historial
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={exportCaja}
              disabled={!filtrados.some((e) => e.tipoEvento === 'PAGO' || e.tipoEvento === 'PAGO_MENSUAL')}
            >
              CSV caja
            </Button>
          </>
        }
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        <DateField
          label="Desde"
          size="small"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
        <DateField
          label="Hasta"
          size="small"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />
        <TextField
          select
          label="Evento"
          size="small"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {TIPOS_EVENTO.map((t) => (
            <MenuItem key={t.value || 'all'} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={cargar}>
          Filtrar
        </Button>
      </Stack>

      {admin && totales && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Totales del período: Pagos ${totales.totalPagos} · Mensuales ${totales.totalPagosMensuales} ·
          General ${totales.totalGeneral}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {count === 0 ? (
        <EmptyState
          message={`Sin eventos${tipo ? ` de tipo “${labelTipoEvento(tipo)}”` : ''} en el período.`}
        />
      ) : (
        <Box
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            overflow: 'auto',
            bgcolor: colors.surface,
          }}
        >
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Evento</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Medio</TableCell>
                <TableCell align="right">Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{e.fechaHora?.replace('T', ' ').slice(0, 16)}</TableCell>
                  <TableCell>{labelTipoEvento(e.tipoEvento)}</TableCell>
                  <TableCell>{e.descripcion}</TableCell>
                  <TableCell>{e.personaEmail || '—'}</TableCell>
                  <TableCell>{labelMedioPago(e.medioPago)}</TableCell>
                  <TableCell align="right">{e.monto != null ? `$${e.monto}` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager
            count={count}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </Box>
      )}
    </AppLayout>
  )
}
