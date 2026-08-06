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

function EstadoRow({ color, label, count }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.4 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '3px',
          bgcolor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography className="mono" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
        {count}
      </Typography>
    </Stack>
  )
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
  const [egresoTarget, setEgresoTarget] = useState(null)
  const [error, setError] = useState('')
  const [ticketPreview, setTicketPreview] = useState(null)

  async function buscar() {
    setError('')
    setResultado(null)
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
      setResultado(data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró estadía activa')
    } finally {
      setBuscando(false)
    }
  }

  const puedeIngresar =
    !selectedPlaza ||
    (selectedPlaza.activa && (!selectedPlaza.ocupada || selectedPlaza.puedeOtraMoto))

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 320 },
        flexShrink: 0,
        height: { xs: 'auto', md: '100%' },
        maxHeight: { xs: '48dvh', md: 'none' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.surface,
        borderLeft: { md: `1px solid ${colors.border}` },
        borderTop: { xs: `1px solid ${colors.border}`, md: 'none' },
        overflow: 'auto',
      }}
    >
      <Box sx={{ px: 1.75, py: 1.25, borderBottom: `1px solid ${colors.border}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" color="text.secondary">
            Operación · Piso {piso}
          </Typography>
          <Button
            size="small"
            onClick={onRefresh}
            startIcon={<RefreshCw size={14} />}
            sx={{ minWidth: 0 }}
          >
            Actualizar
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
          Edificio · {statsEdificio.libres} libres / {statsEdificio.ocupadas} ocup.
        </Typography>
      </Box>

      <Box sx={{ px: 1.75, py: 1.5 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
          Este piso
        </Typography>
        <EstadoRow color={colors.libre} label="Libres" count={stats.libres} />
        <EstadoRow color={colors.reservada} label="Reservadas" count={stats.reservadas} />
        <EstadoRow color={colors.ocupada} label="Ocupadas" count={stats.ocupadas} />
        <EstadoRow color={colors.fueraServicio} label="Inactivas" count={stats.inactivas} />
      </Box>

      <Divider />

      <Box sx={{ px: 1.75, py: 1.5 }}>
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
            inputProps={{ className: 'mono' }}
            placeholder={tipoBusqueda === 'patente' ? 'ABC123' : 'TK-…'}
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

        {resultado && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.25,
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

      <Divider />

      <Box sx={{ px: 1.75, py: 1.5, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Acciones
        </Typography>

        {selectedPlaza ? (
          <Box
            sx={{
              p: 1.25,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              mb: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Plaza seleccionada (opcional)
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{selectedPlaza.codigo}</Typography>
            {selectedPlaza.patente && (
              <Typography className="mono" variant="body2">
                {selectedPlaza.patente}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Podés ingresar solo con patente y modelo, o elegir una plaza en el plano.
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

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          {LEYENDA_PLAZAS.map((item) => (
            <Stack key={item.label} direction="row" alignItems="center" spacing={0.5}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '2px',
                  bgcolor: item.color,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.label}
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
