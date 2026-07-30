package com.musicalsniffle.controller;

import com.musicalsniffle.dto.TicketResponse;
import com.musicalsniffle.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/{codigo}")
    public TicketResponse buscarPorCodigo(@PathVariable String codigo) {
        return ticketService.buscarPorCodigo(codigo);
    }
}
