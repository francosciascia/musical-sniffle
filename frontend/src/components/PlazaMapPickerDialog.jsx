import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { MapPin } from 'lucide-react'
import api from '../api/client'
import ParkingMap from './ParkingMap'
import { colors } from '../theme/colors'
import { celdasDelPiso, derivePisosDesdePlazasYPlantas, pisosDesdePlantas } from '../utils/plantaForma'

/**
 * Diálogo para elegir una plaza clickeando el mapa.
 * filterPlaza: predicado de plazas seleccionables (default: libre).
 */
export default function PlazaMapPickerDialog({
  open,
  onClose,
  onPick,
  selectedId,
  title = 'Elegir plaza en el mapa',
  filterPlaza = (p) => p.activa && !p.ocupada && !p.reservada,
  hint = 'Tocá una plaza libre (verde) para seleccionarla.',
}) {
  const [todasPlazas, setTodasPlazas] = useState([])
  const [plantas, setPlantas] = useState([])
  const [piso, setPiso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewId, setPreviewId] = useState(selectedId ?? null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [resPlazas, resPlantas] = await Promise.all([
        api.get('/operador/plazas/estado'),
        api.get('/operador/plantas'),
      ])
      setTodasPlazas(resPlazas.data)
      setPlantas(resPlantas.data)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el mapa')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setPreviewId(selectedId ?? null)
      cargar()
    }
  }, [open, selectedId, cargar])

  const pisos = useMemo(() => {
    const guardados = pisosDesdePlantas(plantas)
    if (guardados.length) return guardados
    return derivePisosDesdePlazasYPlantas(todasPlazas, plantas)
  }, [todasPlazas, plantas])

  useEffect(() => {
    if (pisos.length && !pisos.includes(piso)) {
      setPiso(pisos[0])
    }
  }, [pisos, piso])

  const plazasPiso = useMemo(
    () => todasPlazas.filter((p) => (p.piso || 1) === piso),
    [todasPlazas, piso],
  )

  const celdasForma = useMemo(() => celdasDelPiso(plantas, piso), [plantas, piso])
  const plantaActual = useMemo(() => plantas.find((p) => p.piso === piso), [plantas, piso])

  const preview = useMemo(
    () => todasPlazas.find((p) => p.id === previewId) || null,
    [todasPlazas, previewId],
  )

  function handleSelect(plaza) {
    if (!filterPlaza(plaza)) {
      setError('Esa plaza no está disponible')
      return
    }
    setError('')
    setPreviewId(plaza.id)
  }

  function confirmar() {
    if (!preview || !filterPlaza(preview)) {
      setError('Elegí una plaza disponible en el mapa')
      return
    }
    onPick?.(preview)
    onClose?.()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MapPin size={18} color={colors.primary} />
          <span>{title}</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {hint}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {pisos.length > 1 && (
          <Tabs
            value={piso}
            onChange={(_, v) => setPiso(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 1, borderBottom: `1px solid ${colors.border}` }}
          >
            {pisos.map((p) => (
              <Tab key={p} value={p} label={`Piso ${p}`} />
            ))}
          </Tabs>
        )}

        <Box
          sx={{
            overflow: 'auto',
            maxHeight: { xs: '50vh', sm: '60vh' },
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            bgcolor: colors.surfaceAlt,
            display: 'flex',
            justifyContent: 'center',
            p: 1,
            minHeight: 200,
          }}
        >
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <ParkingMap
              plazas={plazasPiso}
              piso={piso}
              celdasForma={celdasForma}
              gridCols={plantaActual?.gridCols}
              gridRows={plantaActual?.gridRows}
              selectedId={previewId}
              onSelectPlaza={handleSelect}
            />
          )}
        </Box>

        {preview && (
          <Typography variant="body2" sx={{ mt: 1.25 }}>
            Seleccionada:{' '}
            <Box component="span" className="mono" sx={{ fontWeight: 700 }}>
              {preview.codigo}
            </Box>
            {preview.piso ? ` · Piso ${preview.piso}` : ''}
            {!filterPlaza(preview) ? ' (no disponible)' : ''}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={confirmar} disabled={!preview || !filterPlaza(preview)}>
          Usar esta plaza
        </Button>
      </DialogActions>
    </Dialog>
  )
}
