package com.musicalsniffle.service;

import com.musicalsniffle.dto.TicketResponse;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Ticket;
import com.musicalsniffle.repository.TicketRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final DateTimeFormatter CODIGO_FECHA = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final TicketRepository ticketRepository;

    @Transactional
    public Ticket emitir(Estadia estadia, Cliente cliente) {
        Ticket ticket = Ticket.builder()
                .codigo(generarCodigo(estadia))
                .emitidoEn(LocalDateTime.now())
                .estadia(estadia)
                .cliente(cliente)
                .build();

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public TicketResponse buscarPorCodigo(String codigo) {
        Ticket ticket = ticketRepository.findByCodigo(codigo)
                .orElseThrow(() -> new IllegalArgumentException("Ticket no encontrado: " + codigo));
        return TicketResponse.from(ticket);
    }

    @Transactional(readOnly = true)
    public TicketResponse buscarPorEstadiaId(Long estadiaId) {
        Ticket ticket = ticketRepository.findByEstadiaId(estadiaId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket no encontrado para estadía: " + estadiaId));
        return TicketResponse.from(ticket);
    }

    private String generarCodigo(Estadia estadia) {
        String fecha = LocalDateTime.now().format(CODIGO_FECHA);
        return "T-" + fecha + "-" + String.format("%05d", estadia.getId());
    }
}
