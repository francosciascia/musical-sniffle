package com.musicalsniffle.dto;

import com.musicalsniffle.model.Historial;
import com.musicalsniffle.model.MedioPago;
import com.musicalsniffle.model.TipoEvento;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HistorialResponse {

    private Long id;
    private TipoEvento tipoEvento;
    private LocalDateTime fechaHora;
    private String descripcion;
    private Long personaId;
    private String personaEmail;
    private String entidadTipo;
    private Long entidadId;
    private BigDecimal monto;
    private MedioPago medioPago;

    public static HistorialResponse from(Historial historial) {
        return HistorialResponse.builder()
                .id(historial.getId())
                .tipoEvento(historial.getTipoEvento())
                .fechaHora(historial.getFechaHora())
                .descripcion(historial.getDescripcion())
                .personaId(historial.getPersona() != null ? historial.getPersona().getId() : null)
                .personaEmail(historial.getPersona() != null ? historial.getPersona().getEmail() : null)
                .entidadTipo(historial.getEntidadTipo())
                .entidadId(historial.getEntidadId())
                .monto(historial.getMonto())
                .medioPago(historial.getMedioPago())
                .build();
    }
}
