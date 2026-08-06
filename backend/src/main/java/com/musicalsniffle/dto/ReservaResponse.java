package com.musicalsniffle.dto;

import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.Reserva;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReservaResponse {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private Long plazaId;
    private String plazaCodigo;
    private List<Long> autoIds;
    private List<String> patentes;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private BigDecimal montoMensual;
    private EstadoReserva estado;
    private LocalDateTime creadaEn;
    /** Solo en lista a cobrar: vencido | vence_hoy | por_vencer | suspendida */
    private String motivoCobro;
    private Long diasParaVencer;

    public static ReservaResponse from(Reserva reserva) {
        return from(reserva, null, null);
    }

    public static ReservaResponse from(Reserva reserva, String motivoCobro, Long diasParaVencer) {
        return ReservaResponse.builder()
                .id(reserva.getId())
                .clienteId(reserva.getCliente().getId())
                .clienteNombre(reserva.getCliente().getNombre() + " " + reserva.getCliente().getApellido())
                .plazaId(reserva.getPlaza().getId())
                .plazaCodigo(reserva.getPlaza().getCodigo())
                .autoIds(reserva.getAutos().stream().map(auto -> auto.getId()).toList())
                .patentes(reserva.getAutos().stream().map(auto -> auto.getPatente()).toList())
                .fechaInicio(reserva.getFechaInicio())
                .fechaFin(reserva.getFechaFin())
                .montoMensual(reserva.getMontoMensual())
                .estado(reserva.getEstado())
                .creadaEn(reserva.getCreadaEn())
                .motivoCobro(motivoCobro)
                .diasParaVencer(diasParaVencer)
                .build();
    }
}
