import { useCallback, useEffect, useState } from 'react'
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
import { ArrowUpFromLine, Search } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import EmptyState from '../components/EmptyState'
import EgresoDialog from '../components/EgresoDialog'
import PageHeader from '../components/PageHeader'
import TablePager from '../components/TablePager'
import api from '../api/client'
import { usePagedRows } from '../hooks/usePagedRows'
import { colors } from '../theme/colors'

export default function EstadiasPage() {
  const [estadias, setEstadias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState('patente')
  const [resultado, setResultado] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [egresoTarget, setEgresoTarget] = useState(null)
  const { page, rowsPerPage, setPage, setRowsPerPage, paged, count } = usePagedRows(estadias)

  const cargar = useCallback(async () => {
    setError('')
    try {
      const { data } = await api.get('/operador/estadias/activas')
      setEstadias(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las estadías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function buscar() {
    setError('')
    setResultado(null)
    setCandidatos([])
    if (!busqueda.trim()) {
      setError('Ingresá patente o ticket')
      return
    }
    const param =
      tipoBusqueda === 'patente'
        ? { patente: busqueda.trim().toUpperCase() }
        : { ticket: busqueda.trim() }
    try {
      const { data } = await api.get('/operador/estadias/buscar', { params: param })
      if (Array.isArray(data)) {
        setCandidatos(data)
        if (data.length === 1) setResultado(data[0])
      } else {
        setResultado(data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró estadía activa')
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Estadías activas"
        subtitle="Visitantes en el predio (con ticket). Los abonados no figuran acá: estacionan en su plaza sin ingreso."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Buscar por patente o ticket
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
          <TextField
            select
            label="Buscar por"
            value={tipoBusqueda}
            onChange={(e) => setTipoBusqueda(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="patente">Patente</MenuItem>
            <MenuItem value="ticket">Ticket</MenuItem>
          </TextField>
          <TextField
            label={tipoBusqueda === 'patente' ? 'Patente' : 'Código ticket'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            inputProps={{ className: 'mono' }}
          />
          <Button variant="contained" onClick={buscar} startIcon={<Search size={16} />}>
            Buscar
          </Button>
        </Stack>

        {candidatos.length > 1 && !resultado && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Varias patentes con “{busqueda}”. Elegí una:
            </Typography>
            <Stack spacing={0.75}>
              {candidatos.map((c) => (
                <Button
                  key={c.id}
                  variant="outlined"
                  onClick={() => setResultado(c)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography className="mono" sx={{ fontWeight: 700 }}>
                      {c.patente}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Plaza {c.plazaCodigo || '—'}
                      {c.abonado ? ' · Abonado' : ''}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        {resultado && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.25,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              bgcolor: colors.surface,
            }}
          >
            <Typography className="mono" sx={{ fontWeight: 700 }}>
              {resultado.patente}
            </Typography>
            <Typography variant="body2">
              Plaza {resultado.plazaCodigo || '—'}
              {resultado.abonado ? ' · Abonado' : ''}
            </Typography>
            <Typography variant="caption" className="mono" color="text.secondary">
              Ticket {resultado.ticket?.codigo}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 1 }}
              startIcon={<ArrowUpFromLine size={16} />}
              onClick={() => setEgresoTarget(resultado)}
            >
              Registrar egreso
            </Button>
          </Box>
        )}
      </Box>

      {!loading && count === 0 ? (
        <EmptyState message="No hay vehículos estacionados. Registrá un ingreso desde el mapa." />
      ) : (
        <Box
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            overflow: 'auto',
            bgcolor: colors.surface,
          }}
        >
          <Table size="small" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patente</TableCell>
                <TableCell>Plaza</TableCell>
                <TableCell>Ticket</TableCell>
                <TableCell>Abonado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Cargando…
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>
                      <span className="mono">{e.patente}</span>
                    </TableCell>
                    <TableCell>{e.plazaCodigo || '—'}</TableCell>
                    <TableCell>
                      <span className="mono">{e.ticket?.codigo}</span>
                    </TableCell>
                    <TableCell>{e.abonado ? 'Sí' : 'No'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="secondary"
                        variant="contained"
                        startIcon={<ArrowUpFromLine size={14} />}
                        onClick={() => setEgresoTarget(e)}
                      >
                        Egreso
                      </Button>
                    </TableCell>
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

      <EgresoDialog
        open={!!egresoTarget}
        estadia={egresoTarget}
        onClose={() => setEgresoTarget(null)}
        onSuccess={() => {
          setResultado(null)
          cargar()
        }}
      />
    </AppLayout>
  )
}
