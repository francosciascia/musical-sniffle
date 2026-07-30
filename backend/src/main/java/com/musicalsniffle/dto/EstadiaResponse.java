package com.musicalsniffle.dto;

import com.musicalsniffle.model.Estadia;
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

    public static EstadiaResponse from(Estadia estadia, TicketResponse ticket) {
        return EstadiaResponse.builder()
                .id(estadia.getId())
                .patente(estadia.getAuto().getPatente())
                .plazaCodigo(estadia.getPlaza() != null ? estadia.getPlaza().getCodigo() : null)
                .abonado(estadia.isAbonado())
                .ticket(ticket)
                .build();
    }
}
