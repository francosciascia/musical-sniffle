import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material'
import api from '../api/client'
import { colors } from '../theme/colors'

export default function ReglasPanel() {
  const [plazaObligatoria, setPlazaObligatoria] = useState(false)
  const [permitirDosMotos, setPermitirDosMotos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/ajustes')
      setPlazaObligatoria(!!data.plazaObligatoria)
      setPermitirDosMotos(!!data.permitirDosMotosPorPlaza)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las reglas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function guardar() {
    setSaving(true)
    setError('')
    setOk('')
    try {
      const { data } = await api.put('/admin/ajustes', {
        plazaObligatoria,
        permitirDosMotosPorPlaza: permitirDosMotos,
      })
      setPlazaObligatoria(!!data.plazaObligatoria)
      setPermitirDosMotos(!!data.permitirDosMotosPorPlaza)
      setOk('Reglas guardadas')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron guardar las reglas')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Reglas simples para un estacionamiento informal. El ingreso sigue siendo flexible.
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

      <Box
        sx={{
          p: 2,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          bgcolor: colors.surfaceAlt,
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={permitirDosMotos}
              onChange={(e) => setPermitirDosMotos(e.target.checked)}
              disabled={loading || saving}
            />
          }
          label="Permitir 2 motos en el mismo lugar"
        />
        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 6, mt: -0.5 }}>
          Si está apagado, cada plaza admite un solo vehículo (como ahora). Si lo activás, dos
          motos pueden compartir plaza; un auto sigue ocupando el lugar entero.
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          bgcolor: colors.surfaceAlt,
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={plazaObligatoria}
              onChange={(e) => setPlazaObligatoria(e.target.checked)}
              disabled={loading || saving}
            />
          }
          label="Exigir plaza al ingresar visitante"
        />
        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 6, mt: -0.5 }}>
          Para un estacionamiento informal conviene dejarlo apagado: podés anotar patente sin
          elegir lugar.
        </Typography>
      </Box>

      <Button variant="contained" onClick={guardar} disabled={loading || saving}>
        {saving ? 'Guardando…' : 'Guardar reglas'}
      </Button>
    </Box>
  )
}
