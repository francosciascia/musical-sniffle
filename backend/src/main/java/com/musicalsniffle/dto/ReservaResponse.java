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

    public static ReservaResponse from(Reserva reserva) {
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
                .build();
    }
}
