package com.musicalsniffle.dto;

import com.musicalsniffle.model.Estadia;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EstadiaResponse {

    private Long id;
    private String patente;
    private String plazaCodigo;
    private boolean abonado;
    private TicketResponse ticket;
    /** Avisos blandos (abono por vencer, en gracia, etc.). */
    private List<String> avisos;

    public static EstadiaResponse from(Estadia estadia, TicketResponse ticket) {
        return from(estadia, ticket, List.of());
    }

    public static EstadiaResponse from(Estadia estadia, TicketResponse ticket, List<String> avisos) {
        return EstadiaResponse.builder()
                .id(estadia.getId())
                .patente(estadia.getAuto().getPatente())
                .plazaCodigo(estadia.getPlaza() != null ? estadia.getPlaza().getCodigo() : null)
                .abonado(estadia.isAbonado())
                .ticket(ticket)
                .avisos(avisos == null ? List.of() : avisos)
                .build();
    }
}
