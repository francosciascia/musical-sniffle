import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Printer,
  RefreshCw,
  Search,
} from 'lucide-react'
import { colors, LEYENDA_PLAZAS } from '../theme/colors'
import api from '../api/client'
import TicketPreviewDialog from './TicketPreviewDialog'
import EgresoDialog from './EgresoDialog'

export default function OpsSidePanel({
  piso,
  stats,
  statsEdificio,
  selectedPlaza,
  onRefresh,
  onIngresoPlaza,
  onEgresoOk,
}) {
  const [patente, setPatente] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState('patente')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [egresoTarget, setEgresoTarget] = useState(null)
  const [error, setError] = useState('')
  const [ticketPreview, setTicketPreview] = useState(null)

  async function buscar() {
    setError('')
    setResultado(null)
    setCandidatos([])
    if (!patente.trim()) {
      setError('Ingresá una patente o ticket')
      return
    }
    setBuscando(true)
    try {
      const params =
        tipoBusqueda === 'patente'
          ? { patente: patente.trim().toUpperCase() }
          : { ticket: patente.trim() }
      const { data } = await api.get('/operador/estadias/buscar', { params })
      if (Array.isArray(data)) {
        setCandidatos(data)
        if (data.length === 1) setResultado(data[0])
      } else {
        setResultado(data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró estadía activa')
    } finally {
      setBuscando(false)
    }
  }

  const puedeIngresar =
    !selectedPlaza ||
    (selectedPlaza.activa && (!selectedPlaza.ocupada || selectedPlaza.puedeOtraMoto))

  const countByLabel = {
    Libre: stats.libres,
    Reservada: stats.reservadas,
    Ocupada: stats.ocupadas,
    'Fuera de servicio': stats.inactivas,
  }

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 300 },
        maxWidth: { md: 300 },
        flexShrink: 0,
        height: { xs: 'auto', md: '100%' },
        maxHeight: { xs: '48dvh', md: 'none' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.surface,
        borderLeft: { md: `1px solid ${colors.border}` },
        borderTop: { xs: `1px solid ${colors.border}`, md: 'none' },
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ px: 1.5, py: 1.1, borderBottom: `1px solid ${colors.border}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary" noWrap>
            Acciones · Piso {piso}
          </Typography>
          <Button
            size="small"
            onClick={onRefresh}
            startIcon={<RefreshCw size={14} />}
            sx={{ minWidth: 0, flexShrink: 0 }}
          >
            Actualizar
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }} noWrap>
          Edificio · {statsEdificio.libres} libres / {statsEdificio.ocupadas} ocup. /{' '}
          {statsEdificio.reservadas} res.
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, py: 1.25 }}>
        {selectedPlaza ? (
          <Box
            sx={{
              p: 1.1,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              mb: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Plaza seleccionada
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{selectedPlaza.codigo}</Typography>
            {selectedPlaza.reservada && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Abonado{selectedPlaza.reservaCliente ? `: ${selectedPlaza.reservaCliente}` : ''}
              </Typography>
            )}
            {selectedPlaza.patente && (
              <Typography className="mono" variant="body2">
                {selectedPlaza.patente}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tocá una plaza o registrá ingreso solo con patente.
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          disabled={!puedeIngresar}
          startIcon={<ArrowDownToLine size={16} />}
          onClick={() => onIngresoPlaza?.(selectedPlaza || null)}
          sx={{ mb: 1 }}
        >
          Registrar ingreso
        </Button>

        {selectedPlaza?.ocupada && selectedPlaza?.patentes?.length > 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Varias motos: {selectedPlaza.patentes.join(', ')}. Buscá por patente para egresar.
          </Typography>
        )}

        {selectedPlaza?.ocupada && (
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            disabled={buscando || !selectedPlaza.patente}
            startIcon={<ArrowUpFromLine size={16} />}
            onClick={async () => {
              if (!selectedPlaza.patente) return
              setPatente(selectedPlaza.patente)
              setTipoBusqueda('patente')
              setError('')
              setBuscando(true)
              try {
                const { data } = await api.get('/operador/estadias/buscar', {
                  params: { patente: selectedPlaza.patente },
                })
                setResultado(data)
                setEgresoTarget(data)
              } catch (err) {
                setError(err.response?.data?.error || 'No se encontró estadía activa')
              } finally {
                setBuscando(false)
              }
            }}
          >
            Egreso {selectedPlaza.patentes?.length > 1 ? `(${selectedPlaza.patente})` : 'de esta plaza'}
          </Button>
        )}
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Buscar egreso
        </Typography>
        <Stack spacing={1}>
          <TextField
            select
            label="Buscar por"
            value={tipoBusqueda}
            onChange={(e) => setTipoBusqueda(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="patente">Patente</MenuItem>
            <MenuItem value="ticket">Ticket</MenuItem>
          </TextField>
          <TextField
            label={tipoBusqueda === 'patente' ? 'Patente' : 'Código ticket'}
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            fullWidth
            size="small"
            inputProps={{ className: 'mono' }}
            placeholder={tipoBusqueda === 'patente' ? '986 o AA123BB' : 'TK-…'}
          />
          <Button
            variant="contained"
            onClick={buscar}
            disabled={buscando}
            startIcon={buscando ? <Loader2 size={16} /> : <Search size={16} />}
          >
            Buscar
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {candidatos.length > 1 && !resultado && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Varias patentes con “{patente}”. Elegí una:
            </Typography>
            <Stack spacing={0.75}>
              {candidatos.map((c) => (
                <Button
                  key={c.id}
                  variant="outlined"
                  fullWidth
                  onClick={() => setResultado(c)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                    <Typography className="mono" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {c.patente}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
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
              p: 1.1,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              bgcolor: colors.surfaceAlt,
            }}
          >
            <Typography className="mono" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {resultado.patente}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Plaza {resultado.plazaCodigo || '—'}
              {resultado.abonado ? ' · Abonado' : ''}
            </Typography>
            <Typography variant="caption" className="mono" color="text.secondary">
              Ticket {resultado.ticket?.codigo}
            </Typography>
            {resultado.ticket && (
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 1 }}
                startIcon={<Printer size={16} />}
                onClick={() => setTicketPreview(resultado.ticket)}
              >
                Ver / imprimir ticket
              </Button>
            )}
            <Button
              fullWidth
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

      <Box sx={{ mt: 'auto', px: 1.5, py: 1.25, borderTop: `1px solid ${colors.border}` }}>
        <Stack spacing={0.5}>
          {LEYENDA_PLAZAS.filter((item) => item.label !== '1 moto (cabe otra)').map((item) => (
            <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '2px',
                  bgcolor: item.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }} noWrap>
                {item.label}
              </Typography>
              <Typography variant="caption" className="mono" sx={{ fontWeight: 700 }}>
                {countByLabel[item.label] ?? '—'}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <TicketPreviewDialog
        open={!!ticketPreview}
        ticket={ticketPreview}
        onClose={() => setTicketPreview(null)}
      />

      <EgresoDialog
        open={!!egresoTarget}
        estadia={egresoTarget}
        onClose={() => setEgresoTarget(null)}
        onSuccess={() => {
          setResultado(null)
          onEgresoOk?.()
        }}
      />
    </Box>
  )
}
