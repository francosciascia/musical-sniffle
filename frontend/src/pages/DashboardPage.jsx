import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  Activity,
  Car,
  Clock3,
  LayoutDashboard,
  ParkingSquare,
  Wallet,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import api from '../api/client'
import { colors } from '../theme/colors'
import { isAdmin } from '../utils/auth'

const RANGOS = [
  { id: '7', label: 'Últimos 7 días', days: 7 },
  { id: '30', label: 'Últimos 30 días', days: 30 },
  { id: '90', label: 'Últimos 90 días', days: 90 },
]

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function rangeParams(days) {
  const hasta = new Date()
  const desde = new Date()
  desde.setDate(hasta.getDate() - (days - 1))
  return { desde: isoDate(desde), hasta: isoDate(hasta) }
}

function money(v) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        bgcolor: colors.surface,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        <Icon size={16} color={colors.primary} strokeWidth={2.25} />
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontWeight: 700, fontSize: '1.35rem', lineHeight: 1.2 }} className="mono">
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {hint}
        </Typography>
      )}
    </Box>
  )
}

function BarChart({ title, items, accent = colors.primary, formatLabel }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <Box
      sx={{
        p: 1.5,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        bgcolor: colors.surface,
        height: '100%',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Stack spacing={0.85}>
        {items.map((item) => (
          <Box key={item.label}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {formatLabel ? formatLabel(item.label) : item.label}
              </Typography>
              <Typography variant="caption" className="mono" color="text.secondary">
                {item.value}
              </Typography>
            </Stack>
            <Box sx={{ height: 8, bgcolor: colors.surfaceAlt, borderRadius: '2px', overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${(item.value / max) * 100}%`,
                  bgcolor: accent,
                  borderRadius: '2px',
                  minWidth: item.value > 0 ? 4 : 0,
                }}
              />
            </Box>
          </Box>
        ))}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Sin datos en el período
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

function SparkBars({ title, items }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <Box
      sx={{
        p: 1.5,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        bgcolor: colors.surface,
        height: '100%',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '3px',
          height: 120,
          overflowX: 'auto',
          pb: 0.5,
        }}
      >
        {items.map((item) => (
          <Box
            key={item.label}
            title={`${item.label}: ${item.value}`}
            sx={{
              flex: '1 0 8px',
              minWidth: 8,
              maxWidth: 18,
              height: `${Math.max(2, (item.value / max) * 100)}%`,
              bgcolor: item.value > 0 ? colors.primary : colors.border,
              borderRadius: '2px 2px 0 0',
            }}
          />
        ))}
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary">
          {items[0]?.label || ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {items[items.length - 1]?.label || ''}
        </Typography>
      </Stack>
    </Box>
  )
}

function OccupancyStrip({ occupancy }) {
  const total = Math.max(1, occupancy?.total || 0)
  const parts = [
    { key: 'libres', value: occupancy?.libres || 0, color: colors.libre },
    { key: 'ocupadas', value: occupancy?.ocupadas || 0, color: colors.ocupada },
    { key: 'reservadas', value: occupancy?.reservadas || 0, color: colors.reservada },
    { key: 'fuera', value: occupancy?.fueraServicio || 0, color: colors.fueraServicio },
  ]
  return (
    <Box
      sx={{
        p: 1.5,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        bgcolor: colors.surface,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Estado actual del edificio
      </Typography>
      <Box sx={{ display: 'flex', height: 18, borderRadius: '4px', overflow: 'hidden', mb: 1.25 }}>
        {parts.map((p) =>
          p.value > 0 ? (
            <Box
              key={p.key}
              sx={{ width: `${(p.value / total) * 100}%`, bgcolor: p.color }}
              title={`${p.key}: ${p.value}`}
            />
          ) : null,
        )}
      </Box>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {[
          ['Libres', occupancy?.libres, colors.libre],
          ['Ocupadas', occupancy?.ocupadas, colors.ocupada],
          ['Reservadas', occupancy?.reservadas, colors.reservada],
          ['Fuera de servicio', occupancy?.fueraServicio, colors.fueraServicio],
        ].map(([label, value, color]) => (
          <Stack key={label} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
            <Typography variant="caption">
              {label}{' '}
              <Box component="span" className="mono" sx={{ fontWeight: 700 }}>
                {value ?? 0}
              </Box>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export default function DashboardPage() {
  const admin = isAdmin()
  const [rango, setRango] = useState('30')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const days = RANGOS.find((r) => r.id === rango)?.days || 30
      const params = rangeParams(days)
      const url = admin ? '/admin/dashboard' : '/operador/dashboard'
      const { data: res } = await api.get(url, { params })
      setData(res)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [admin, rango])

  useEffect(() => {
    cargar()
  }, [cargar])

  const vehicleItems = useMemo(() => data?.vehicleMix || [], [data])
  const hourlyItems = useMemo(() => data?.hourlyIngresos || [], [data])
  const weekdayItems = useMemo(() => data?.weekdayIngresos || [], [data])
  const dailyItems = useMemo(() => data?.dailyIngresos || [], [data])
  const stayItems = useMemo(() => data?.stayDurationBuckets || [], [data])

  return (
    <AppLayout>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <LayoutDashboard size={20} color={colors.primary} />
          <Box>
            <Typography variant="h5" sx={{ mb: 0, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              Dashboard operativo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tráfico, ocupación y mix de vehículos
            </Typography>
          </Box>
        </Stack>
        <TextField
          select
          label="Período"
          value={rango}
          onChange={(e) => setRango(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {RANGOS.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : data ? (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(3, 1fr)',
                lg: admin && data.revenue ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            <StatCard
              icon={ParkingSquare}
              label="Ocupación"
              value={`${data.ocupacionPct ?? 0}%`}
              hint={`${data.occupancy?.ocupadas ?? 0} de ${data.occupancy?.total ?? 0} plazas`}
            />
            <StatCard
              icon={Car}
              label="Estadías activas"
              value={data.estadiasActivas}
              hint={`${data.reservasActivas} reservas activas`}
            />
            <StatCard
              icon={Activity}
              label="Ingresos hoy"
              value={data.traffic?.ingresosHoy ?? 0}
              hint={`${data.traffic?.salidasHoy ?? 0} salidas hoy`}
            />
            <StatCard
              icon={Clock3}
              label="Pico del período"
              value={`${String(data.traffic?.picoHora ?? 0).padStart(2, '0')}:00`}
              hint={`Día más movido: ${data.traffic?.diaMasMovido || '—'}`}
            />
            {admin && data.revenue && (
              <>
                <StatCard
                  icon={Wallet}
                  label="Recaudado hoy"
                  value={money(data.revenue.hoy)}
                  hint={`Ticket promedio: ${money(data.revenue.ticketPromedio)}`}
                />
                <StatCard
                  icon={Wallet}
                  label="Recaudado período"
                  value={money(data.revenue.periodo)}
                  hint={`Mensuales: ${money(data.revenue.mensualesPeriodo)}`}
                />
              </>
            )}
          </Box>

          <OccupancyStrip occupancy={data.occupancy} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            <BarChart
              title="Tipo de vehículo (ingresos del período)"
              items={vehicleItems}
              accent={colors.primary}
            />
            <BarChart
              title="Duración de estadías cerradas"
              items={stayItems}
              accent={colors.accentDark}
            />
            <BarChart
              title="Ingresos por día de la semana"
              items={weekdayItems}
              accent={colors.primaryLight}
            />
            <BarChart
              title="Ingresos por hora (0–23)"
              items={hourlyItems.filter((h) => Number(h.label) >= 6 && Number(h.label) <= 22)}
              accent={colors.cementDark}
              formatLabel={(l) => `${l}:00`}
            />
          </Box>

          <SparkBars title="Ingresos diarios del período" items={dailyItems} />

          <Typography variant="caption" color="text.secondary">
            Período: {data.traffic?.ingresosPeriodo ?? 0} ingresos · {data.traffic?.salidasPeriodo ?? 0}{' '}
            salidas
            {admin ? ' · Montos visibles solo para Super Admin' : ''}
          </Typography>
        </Stack>
      ) : null}
    </AppLayout>
  )
}
