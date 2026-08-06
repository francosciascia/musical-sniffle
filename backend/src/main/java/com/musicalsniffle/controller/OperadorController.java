package com.musicalsniffle.controller;

import com.musicalsniffle.dto.EstadiaResponse;
import com.musicalsniffle.dto.PlazaEstadoResponse;
import com.musicalsniffle.service.EstacionamientoService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operador")
@RequiredArgsConstructor
public class OperadorController {

    private final EstacionamientoService estacionamientoService;

    @GetMapping("/estadias/activas")
    public List<EstadiaResponse> listarEstadiasActivas() {
        return estacionamientoService.listarEstadiasActivas();
    }

    @GetMapping("/estadias/buscar")
    public Object buscarEstadiaActiva(
            @RequestParam(required = false) String patente,
            @RequestParam(required = false) String ticket) {

        if (patente != null && !patente.isBlank()) {
            List<EstadiaResponse> matches =
                    estacionamientoService.buscarEstadiasActivasPorPatente(patente);
            if (matches.isEmpty()) {
                throw new IllegalArgumentException("No hay estadía activa para patente: " + patente);
            }
            // Una sola: objeto (compat). Varias: lista para elegir.
            return matches.size() == 1 ? matches.get(0) : matches;
        }
        if (ticket != null && !ticket.isBlank()) {
            return estacionamientoService.buscarEstadiaActivaPorTicket(ticket);
        }
        throw new IllegalArgumentException("Indicá patente o ticket");
    }

    @GetMapping("/plazas/estado")
    public List<PlazaEstadoResponse> listarEstadoPlazas(
            @RequestParam(required = false) Integer piso) {
        return estacionamientoService.listarEstadoPlazas(piso);
    }
}
