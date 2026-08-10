import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  Loader2,
  Printer,
  RefreshCw,
  Search,
} from 'lucide-react'
import { colors, plazaFill } from '../theme/colors'
import api from '../api/client'
import MapaLeyenda from './MapaLeyenda'
import TicketPreviewDialog from './TicketPreviewDialog'
import EgresoDialog from './EgresoDialog'

function estadoPlazaLabel(plaza) {
  if (!plaza.activa) return 'Fuera de servicio'
  if (plaza.ocupada) return plaza.puedeOtraMoto ? '1 moto (cabe otra)' : 'Ocupada'
  if (plaza.reservada) return 'Reservada / abonado'
  return 'Libre'
}

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

  const estadoColor = selectedPlaza ? plazaFill(selectedPlaza) : null

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
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: '"Oswald", "Inter", sans-serif',
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
              noWrap
            >
              Acciones · Piso {piso}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Edificio · {statsEdificio.libres} libres / {statsEdificio.ocupadas} ocup.
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={onRefresh}
            startIcon={<RefreshCw size={14} />}
            sx={{ minWidth: 0, flexShrink: 0 }}
          >
            Act.
          </Button>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 1.35 }}>
        {selectedPlaza ? (
          <Box
            sx={{
              p: 1.15,
              mb: 1.25,
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              borderLeft: `4px solid ${estadoColor}`,
              bgcolor: colors.surfaceAlt,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Plaza seleccionada
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1} useFlexGap flexWrap="wrap">
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
                {selectedPlaza.codigo}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: estadoColor }}>
                {estadoPlazaLabel(selectedPlaza)}
              </Typography>
            </Stack>
            {selectedPlaza.reservada && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
                Abonado{selectedPlaza.reservaCliente ? `: ${selectedPlaza.reservaCliente}` : ''}
              </Typography>
            )}
            {selectedPlaza.patente && (
              <Typography className="mono" variant="body2" sx={{ mt: 0.25, fontWeight: 600 }}>
                {selectedPlaza.patente}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
            Tocá una plaza o registrá ingreso solo con patente.
          </Typography>
        )}

        <Stack spacing={1}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={!puedeIngresar}
            startIcon={<ArrowDownToLine size={18} />}
            onClick={() => onIngresoPlaza?.(selectedPlaza || null)}
            sx={{ minHeight: 46, fontSize: '0.9rem' }}
          >
            Registrar ingreso
          </Button>

          {selectedPlaza?.ocupada && selectedPlaza?.patentes?.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              Varias motos: {selectedPlaza.patentes.join(', ')}. Buscá por patente para egresar.
            </Typography>
          )}

          {selectedPlaza?.ocupada && (
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              disabled={buscando || !selectedPlaza.patente}
              startIcon={<ArrowUpFromLine size={18} />}
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
              sx={{ minHeight: 46, fontSize: '0.9rem' }}
            >
              Egreso {selectedPlaza.patentes?.length > 1 ? `(${selectedPlaza.patente})` : 'de esta plaza'}
            </Button>
          )}
        </Stack>
      </Box>

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          bgcolor: 'transparent',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        }}
      >
        <AccordionSummary
          expandIcon={<ChevronDown size={18} />}
          sx={{
            minHeight: 40,
            px: 1.5,
            '& .MuiAccordionSummary-content': { my: 0.75 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Search size={14} />
            <Typography variant="subtitle2" color="text.secondary">
              Buscar egreso
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
          <Stack spacing={1}>
            <TextField
              select
              label="Buscar por"
              value={tipoBusqueda}
              onChange={(e) => setTipoBusqueda(e.target.value)}
              fullWidth
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="patente">Patente</option>
              <option value="ticket">Ticket</option>
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
              variant="outlined"
              onClick={buscar}
              disabled={buscando}
              startIcon={buscando ? <Loader2 size={16} /> : <Search size={16} />}
            >
              Buscar
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 1.25 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {candidatos.length > 1 && !resultado && (
            <Box sx={{ mt: 1.25 }}>
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
                mt: 1.25,
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
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 'auto', px: 1.5, py: 1.15, borderTop: `1px solid ${colors.border}` }}>
        <MapaLeyenda
          variant="compact"
          showMotoParcial={false}
          libres={stats.libres}
          reservadas={stats.reservadas}
          ocupadas={stats.ocupadas}
          inactivas={stats.inactivas}
        />
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
