package com.musicalsniffle.dto;

import com.musicalsniffle.model.Ticket;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TicketResponse {

    private Long id;
    private String codigo;
    private LocalDateTime emitidoEn;
    private Long estadiaId;
    private String patente;
    private String plazaCodigo;
    private Long clienteId;
    private String clienteNombre;
    private boolean abonado;

    public static TicketResponse from(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .codigo(ticket.getCodigo())
                .emitidoEn(ticket.getEmitidoEn())
                .estadiaId(ticket.getEstadia().getId())
                .patente(ticket.getEstadia().getAuto().getPatente())
                .plazaCodigo(ticket.getEstadia().getPlaza() != null
                        ? ticket.getEstadia().getPlaza().getCodigo()
                        : null)
                .clienteId(ticket.getCliente() != null ? ticket.getCliente().getId() : null)
                .clienteNombre(ticket.getCliente() != null
                        ? ticket.getCliente().getNombre() + " " + ticket.getCliente().getApellido()
                        : null)
                .abonado(ticket.getEstadia().isAbonado())
                .build();
    }
}
