package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.dto.CalculoResponse;
import com.musicalsniffle.dto.EstadiaResponse;
import com.musicalsniffle.dto.TicketResponse;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.EstacionamientoService;
import com.musicalsniffle.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EstacionamientoController {

    private final EstacionamientoService estacionamientoService;
    private final TicketService ticketService;

    @GetMapping("/autos")
    public List<Auto> listarAutos() {
        return estacionamientoService.listarAutos();
    }

    @PostMapping("/autos")
    @ResponseStatus(HttpStatus.CREATED)
    public Auto crearAuto(
            @Valid @RequestBody AutoRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return estacionamientoService.crearAuto(request, user.getPersona());
    }

    @PostMapping("/estadias/{id}/cerrar")
    public CalculoResponse cerrarEstadia(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        return estacionamientoService.cerrarEstadia(id, user.getPersona());
    }

    @PostMapping("/estadias")
    @ResponseStatus(HttpStatus.CREATED)
    public EstadiaResponse registrarIngreso(
            @RequestParam Long autoId,
            @RequestParam(required = false) Long plazaId,
            @RequestParam(required = false) Long clienteId,
            @AuthenticationPrincipal UserPrincipal user) {
        return estacionamientoService.registrarIngreso(autoId, plazaId, clienteId, user.getPersona());
    }

    @GetMapping("/estadias/{id}/ticket")
    public TicketResponse obtenerTicket(@PathVariable Long id) {
        return ticketService.buscarPorEstadiaId(id);
    }
}
