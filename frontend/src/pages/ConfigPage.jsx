import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material'
import { LayoutGrid, Receipt, SlidersHorizontal } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import TarifasPanel from '../components/TarifasPanel'
import OperadoresPanel from '../components/OperadoresPanel'
import ReglasPanel from '../components/ReglasPanel'
import { colors } from '../theme/colors'

const TABS = [
  { id: 'diseno', label: 'Diseño' },
  { id: 'tarifas', label: 'Tarifas' },
  { id: 'reglas', label: 'Reglas' },
  { id: 'operadores', label: 'Usuarios' },
]

export default function ConfigPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = useMemo(() => {
    const t = params.get('tab') || 'diseno'
    return TABS.some((x) => x.id === t) ? t : 'diseno'
  }, [params])

  function setTab(id) {
    setParams(id === 'diseno' ? {} : { tab: id }, { replace: true })
  }

  return (
    <AppLayout>
      <Typography variant="h5" sx={{ mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Configuración
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Diseño, tarifas, reglas y operadores.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: `1px solid ${colors.border}` }}
      >
        {TABS.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} />
        ))}
      </Tabs>

      {tab === 'diseno' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Dibujá la estructura del piso (pasillos, entradas, área) y después los lugares.
          </Typography>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              bgcolor: colors.surfaceAlt,
              maxWidth: 480,
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1.5 }}>
              <LayoutGrid size={22} color={colors.primary} strokeWidth={2.25} />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>Editor de planta</Typography>
                <Typography variant="body2" color="text.secondary">
                  Estructura del estacionamiento + plazas por piso.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<LayoutGrid size={16} />}
              onClick={() => navigate('/diseno-mapa')}
              fullWidth
              sx={{ maxWidth: { sm: 280 } }}
            >
              Abrir editor
            </Button>
          </Box>
        </Box>
      )}

      {tab === 'tarifas' && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Receipt size={18} color={colors.primary} />
            <Typography sx={{ fontWeight: 700 }}>Tarifas</Typography>
          </Stack>
          <TarifasPanel />
        </Box>
      )}

      {tab === 'reglas' && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <SlidersHorizontal size={18} color={colors.primary} />
            <Typography sx={{ fontWeight: 700 }}>Reglas de negocio</Typography>
          </Stack>
          <ReglasPanel />
        </Box>
      )}

      {tab === 'operadores' && <OperadoresPanel />}
    </AppLayout>
  )
}
