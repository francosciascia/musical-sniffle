import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import api from '../api/client'
import { colors } from '../theme/colors'

function RuleCard({ children }) {
  return (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        bgcolor: colors.surfaceAlt,
        mb: 2,
      }}
    >
      {children}
    </Box>
  )
}

const EMPTY = {
  plazaObligatoria: false,
  permitirDosMotosPorPlaza: false,
  diasGraciaAbono: 5,
  diasAvisoVencimiento: 7,
  permitirVisitantePlazaAbonado: false,
  avisarAbonoEnGracia: true,
  diasHorizonteCobro: 10,
  diasAtrasoParaSuspender: 10,
  bloquearIngresoSiSuspendida: false,
}

function fromApi(data) {
  return {
    plazaObligatoria: !!data.plazaObligatoria,
    permitirDosMotosPorPlaza: !!data.permitirDosMotosPorPlaza,
    diasGraciaAbono: data.diasGraciaAbono ?? 5,
    diasAvisoVencimiento: data.diasAvisoVencimiento ?? 7,
    permitirVisitantePlazaAbonado: !!data.permitirVisitantePlazaAbonado,
    avisarAbonoEnGracia: data.avisarAbonoEnGracia !== false,
    diasHorizonteCobro: data.diasHorizonteCobro ?? 10,
    diasAtrasoParaSuspender: data.diasAtrasoParaSuspender ?? 10,
    bloquearIngresoSiSuspendida: !!data.bloquearIngresoSiSuspendida,
  }
}

export default function ReglasPanel() {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/ajustes')
      setForm(fromApi(data))
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las reglas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function setBool(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.checked }))
  }

  function setNum(key) {
    return (e) => {
      const n = Number(e.target.value)
      setForm((f) => ({ ...f, [key]: Number.isFinite(n) ? n : 0 }))
    }
  }

  async function guardar() {
    setSaving(true)
    setError('')
    setOk('')
    try {
      const { data } = await api.put('/admin/ajustes', form)
      setForm(fromApi(data))
      setOk('Reglas guardadas')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron guardar las reglas')
    } finally {
      setSaving(false)
    }
  }

  const disabled = loading || saving

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pensado para abonados con lugar fijo y cobro mensual. Avisos antes que bloqueos.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk('')}>
          {ok}
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        Plazas e ingreso
      </Typography>

      <RuleCard>
        <FormControlLabel
          control={
            <Switch
              checked={form.permitirDosMotosPorPlaza}
              onChange={setBool('permitirDosMotosPorPlaza')}
              disabled={disabled}
            />
          }
          label="Permitir 2 motos en el mismo lugar"
        />
      </RuleCard>

      <RuleCard>
        <FormControlLabel
          control={
            <Switch
              checked={form.plazaObligatoria}
              onChange={setBool('plazaObligatoria')}
              disabled={disabled}
            />
          }
          label="Exigir plaza al ingresar visitante"
        />
        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 6, mt: -0.5 }}>
          Apagado = anotar patente sin elegir lugar (recomendado acá).
        </Typography>
      </RuleCard>

      <RuleCard>
        <FormControlLabel
          control={
            <Switch
              checked={form.permitirVisitantePlazaAbonado}
              onChange={setBool('permitirVisitantePlazaAbonado')}
              disabled={disabled}
            />
          }
          label="Permitir visitante en plaza de abonado"
        />
      </RuleCard>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, color: 'text.secondary' }}>
        Abonos y cobro
      </Typography>

      <RuleCard>
        <Stack spacing={1.5}>
          <TextField
            label="Días de gracia después del vencimiento"
            type="number"
            size="small"
            value={form.diasGraciaAbono}
            onChange={setNum('diasGraciaAbono')}
            disabled={disabled}
            inputProps={{ min: 0, max: 60 }}
            helperText="Sigue entrando como abonado N días después de la fecha de fin."
            sx={{ maxWidth: 320 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.avisarAbonoEnGracia}
                onChange={setBool('avisarAbonoEnGracia')}
                disabled={disabled}
              />
            }
            label="Avisar al ingresar si está en gracia"
          />
          <TextField
            label="Avisar si vence dentro de N días"
            type="number"
            size="small"
            value={form.diasAvisoVencimiento}
            onChange={setNum('diasAvisoVencimiento')}
            disabled={disabled}
            inputProps={{ min: 0, max: 90 }}
            helperText="0 = no avisar por vencimiento próximo."
            sx={{ maxWidth: 320 }}
          />
          <TextField
            label="Horizonte lista «A cobrar» (días)"
            type="number"
            size="small"
            value={form.diasHorizonteCobro}
            onChange={setNum('diasHorizonteCobro')}
            disabled={disabled}
            inputProps={{ min: 0, max: 90 }}
            helperText="Cuántos días antes del vencimiento cuentan como «pendientes» en A cobrar (el resto aparecen como al día)."
            sx={{ maxWidth: 320 }}
          />
          <TextField
            label="Días de atraso para auto-suspender"
            type="number"
            size="small"
            value={form.diasAtrasoParaSuspender}
            onChange={setNum('diasAtrasoParaSuspender')}
            disabled={disabled}
            inputProps={{ min: 0, max: 90 }}
            helperText="0 = no suspender solo. Si debe hace N días → Suspendida."
            sx={{ maxWidth: 320 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.bloquearIngresoSiSuspendida}
                onChange={setBool('bloquearIngresoSiSuspendida')}
                disabled={disabled}
              />
            }
            label="Bloquear ingreso si el abono está suspendido"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 6, mt: -1 }}>
            Apagado = puede entrar igual, con aviso para cobrarle.
          </Typography>
        </Stack>
      </RuleCard>

      <Button variant="contained" onClick={guardar} disabled={disabled}>
        {saving ? 'Guardando…' : 'Guardar reglas'}
      </Button>
    </Box>
  )
}
