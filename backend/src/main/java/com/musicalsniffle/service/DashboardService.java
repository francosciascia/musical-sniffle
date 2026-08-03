package com.musicalsniffle.service;

import com.musicalsniffle.dto.DashboardResponse;
import com.musicalsniffle.dto.DashboardResponse.NamedCount;
import com.musicalsniffle.dto.DashboardResponse.Occupancy;
import com.musicalsniffle.dto.DashboardResponse.Revenue;
import com.musicalsniffle.dto.DashboardResponse.Traffic;
import com.musicalsniffle.dto.PlazaEstadoResponse;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Historial;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.model.TipoVehiculo;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.ReservaRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final String[] WEEKDAYS = {
        "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"
    };

    private final EstacionamientoService estacionamientoService;
    private final HistorialService historialService;
    private final EstadiaRepository estadiaRepository;
    private final ReservaRepository reservaRepository;

    @Transactional(readOnly = true)
    public DashboardResponse build(LocalDate desde, LocalDate hasta, boolean includeRevenue) {
        LocalDate hoy = LocalDate.now();
        LocalDate desdeEff = desde != null ? desde : hoy.minusDays(29);
        LocalDate hastaEff = hasta != null ? hasta : hoy;

        LocalDateTime inicio = desdeEff.atStartOfDay();
        LocalDateTime fin = hastaEff.atTime(LocalTime.MAX);
        LocalDateTime inicioHoy = hoy.atStartOfDay();
        LocalDateTime finHoy = hoy.atTime(LocalTime.MAX);

        List<PlazaEstadoResponse> plazas = estacionamientoService.listarEstadoPlazas(null);
        Occupancy occupancy = buildOccupancy(plazas);

        List<Historial> periodo = historialService.listarPorPeriodo(inicio, fin);
        List<Historial> hoyHist = historialService.listarPorPeriodo(inicioHoy, finHoy);

        Traffic traffic = buildTraffic(periodo, hoyHist);
        List<NamedCount> vehicleMix = buildVehicleMix(inicio, fin);
        List<NamedCount> hourly = buildHourly(periodo);
        List<NamedCount> weekday = buildWeekday(periodo);
        List<NamedCount> daily = buildDaily(periodo, desdeEff, hastaEff);
        List<NamedCount> stays = buildStayBuckets(inicio, fin);

        long estadiasActivas = estadiaRepository.countByEstado(EstadoEstadia.ABIERTA);
        long reservasActivas = reservaRepository.countByEstado(EstadoReserva.ACTIVA);

        Double ocupacionPct = occupancy.getTotal() == 0
                ? 0.0
                : Math.round(occupancy.getOcupadas() * 1000.0 / occupancy.getTotal()) / 10.0;

        Revenue revenue = null;
        if (includeRevenue) {
            revenue = buildRevenue(inicioHoy, finHoy, inicio, fin);
        }

        return DashboardResponse.builder()
                .occupancy(occupancy)
                .traffic(traffic)
                .revenue(revenue)
                .vehicleMix(vehicleMix)
                .hourlyIngresos(hourly)
                .weekdayIngresos(weekday)
                .dailyIngresos(daily)
                .stayDurationBuckets(stays)
                .reservasActivas(reservasActivas)
                .estadiasActivas(estadiasActivas)
                .ocupacionPct(ocupacionPct)
                .build();
    }

    private Occupancy buildOccupancy(List<PlazaEstadoResponse> plazas) {
        long total = plazas.size();
        long fuera = plazas.stream().filter(p -> !p.isActiva()).count();
        long ocupadas = plazas.stream().filter(p -> p.isActiva() && p.isOcupada()).count();
        long reservadas = plazas.stream()
                .filter(p -> p.isActiva() && !p.isOcupada() && p.isReservada())
                .count();
        long libres = plazas.stream()
                .filter(p -> p.isActiva() && !p.isOcupada() && !p.isReservada())
                .count();
        return Occupancy.builder()
                .total(total)
                .libres(libres)
                .ocupadas(ocupadas)
                .reservadas(reservadas)
                .fueraServicio(fuera)
                .build();
    }

    private Traffic buildTraffic(List<Historial> periodo, List<Historial> hoy) {
        long ingresosHoy = countTipo(hoy, TipoEvento.INGRESO);
        long salidasHoy = countTipo(hoy, TipoEvento.SALIDA);
        long ingresosPeriodo = countTipo(periodo, TipoEvento.INGRESO);
        long salidasPeriodo = countTipo(periodo, TipoEvento.SALIDA);

        Map<Integer, Long> byHour = periodo.stream()
                .filter(h -> h.getTipoEvento() == TipoEvento.INGRESO)
                .collect(Collectors.groupingBy(h -> h.getFechaHora().getHour(), Collectors.counting()));

        long picoHora = byHour.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey().longValue())
                .orElse(0L);

        Map<DayOfWeek, Long> byDow = periodo.stream()
                .filter(h -> h.getTipoEvento() == TipoEvento.INGRESO)
                .collect(Collectors.groupingBy(h -> h.getFechaHora().getDayOfWeek(), Collectors.counting()));

        String diaMasMovido = byDow.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey().getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es-AR")))
                .orElse("—");

        return Traffic.builder()
                .ingresosHoy(ingresosHoy)
                .salidasHoy(salidasHoy)
                .ingresosPeriodo(ingresosPeriodo)
                .salidasPeriodo(salidasPeriodo)
                .picoHora(picoHora)
                .diaMasMovido(capitalize(diaMasMovido))
                .build();
    }

    private List<NamedCount> buildVehicleMix(LocalDateTime desde, LocalDateTime hasta) {
        Map<TipoVehiculo, Long> counts = new EnumMap<>(TipoVehiculo.class);
        for (TipoVehiculo t : TipoVehiculo.values()) {
            counts.put(t, 0L);
        }
        for (Estadia e : estadiaRepository.findByEntradaBetweenWithAuto(desde, hasta)) {
            TipoVehiculo tipo = e.getAuto().getTipo();
            counts.merge(tipo, 1L, Long::sum);
        }
        List<NamedCount> result = new ArrayList<>();
        for (TipoVehiculo t : TipoVehiculo.values()) {
            result.add(NamedCount.builder().label(t.name()).value(counts.get(t)).build());
        }
        return result;
    }

    private List<NamedCount> buildHourly(List<Historial> periodo) {
        long[] hours = new long[24];
        for (Historial h : periodo) {
            if (h.getTipoEvento() == TipoEvento.INGRESO) {
                hours[h.getFechaHora().getHour()]++;
            }
        }
        List<NamedCount> result = new ArrayList<>(24);
        for (int i = 0; i < 24; i++) {
            result.add(NamedCount.builder()
                    .label(String.format("%02d", i))
                    .value(hours[i])
                    .build());
        }
        return result;
    }

    private List<NamedCount> buildWeekday(List<Historial> periodo) {
        long[] days = new long[7];
        for (Historial h : periodo) {
            if (h.getTipoEvento() == TipoEvento.INGRESO) {
                int idx = h.getFechaHora().getDayOfWeek().getValue() - 1; // Mon=0
                days[idx]++;
            }
        }
        List<NamedCount> result = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            result.add(NamedCount.builder().label(WEEKDAYS[i]).value(days[i]).build());
        }
        return result;
    }

    private List<NamedCount> buildDaily(List<Historial> periodo, LocalDate desde, LocalDate hasta) {
        Map<LocalDate, Long> map = new LinkedHashMap<>();
        for (LocalDate d = desde; !d.isAfter(hasta); d = d.plusDays(1)) {
            map.put(d, 0L);
        }
        for (Historial h : periodo) {
            if (h.getTipoEvento() == TipoEvento.INGRESO) {
                LocalDate d = h.getFechaHora().toLocalDate();
                map.computeIfPresent(d, (k, v) -> v + 1);
            }
        }
        return map.entrySet().stream()
                .map(e -> NamedCount.builder()
                        .label(e.getKey().getDayOfMonth() + "/" + e.getKey().getMonthValue())
                        .value(e.getValue())
                        .build())
                .toList();
    }

    private List<NamedCount> buildStayBuckets(LocalDateTime desde, LocalDateTime hasta) {
        long[] buckets = new long[5]; // <1h, 1-3h, 3-6h, 6-12h, >12h
        List<Estadia> cerradas = estadiaRepository.findCerradasEnPeriodo(EstadoEstadia.CERRADA, desde, hasta);
        for (Estadia e : cerradas) {
            if (e.getEntrada() == null || e.getSalida() == null) continue;
            long minutes = Duration.between(e.getEntrada(), e.getSalida()).toMinutes();
            if (minutes < 60) buckets[0]++;
            else if (minutes < 180) buckets[1]++;
            else if (minutes < 360) buckets[2]++;
            else if (minutes < 720) buckets[3]++;
            else buckets[4]++;
        }
        return List.of(
                NamedCount.builder().label("< 1 h").value(buckets[0]).build(),
                NamedCount.builder().label("1–3 h").value(buckets[1]).build(),
                NamedCount.builder().label("3–6 h").value(buckets[2]).build(),
                NamedCount.builder().label("6–12 h").value(buckets[3]).build(),
                NamedCount.builder().label("> 12 h").value(buckets[4]).build());
    }

    private Revenue buildRevenue(LocalDateTime inicioHoy, LocalDateTime finHoy,
                                 LocalDateTime inicio, LocalDateTime fin) {
        BigDecimal hoy = historialService.calcularTotalPagos(inicioHoy, finHoy)
                .add(historialService.calcularTotalPagosMensuales(inicioHoy, finHoy));
        BigDecimal pagos = historialService.calcularTotalPagos(inicio, fin);
        BigDecimal mensuales = historialService.calcularTotalPagosMensuales(inicio, fin);
        long nPagos = historialService.listarPorPeriodo(inicio, fin).stream()
                .filter(h -> h.getTipoEvento() == TipoEvento.PAGO && h.getMonto() != null)
                .count();
        BigDecimal ticketPromedio = nPagos == 0
                ? BigDecimal.ZERO
                : pagos.divide(BigDecimal.valueOf(nPagos), 2, RoundingMode.HALF_UP);

        return Revenue.builder()
                .hoy(hoy)
                .periodo(pagos.add(mensuales))
                .mensualesPeriodo(mensuales)
                .ticketPromedio(ticketPromedio)
                .build();
    }

    private long countTipo(List<Historial> list, TipoEvento tipo) {
        return list.stream().filter(h -> h.getTipoEvento() == tipo).count();
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return "—";
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
