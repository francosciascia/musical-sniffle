package com.musicalsniffle.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {

    private Occupancy occupancy;
    private Traffic traffic;
    private Revenue revenue;
    private List<NamedCount> vehicleMix;
    private List<NamedCount> hourlyIngresos;
    private List<NamedCount> weekdayIngresos;
    private List<NamedCount> dailyIngresos;
    private List<NamedCount> stayDurationBuckets;
    private long reservasActivas;
    private long estadiasActivas;
    private Double ocupacionPct;

    @Data
    @Builder
    public static class Occupancy {
        private long total;
        private long libres;
        private long ocupadas;
        private long reservadas;
        private long fueraServicio;
    }

    @Data
    @Builder
    public static class Traffic {
        private long ingresosHoy;
        private long salidasHoy;
        private long ingresosPeriodo;
        private long salidasPeriodo;
        private long picoHora; // 0-23
        private String diaMasMovido;
    }

    @Data
    @Builder
    public static class Revenue {
        private BigDecimal hoy;
        private BigDecimal periodo;
        private BigDecimal mensualesPeriodo;
        private BigDecimal ticketPromedio;
    }

    @Data
    @Builder
    public static class NamedCount {
        private String label;
        private long value;
    }
}
