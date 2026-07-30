package com.musicalsniffle.controller;

import com.musicalsniffle.dto.PlazaRequest;
import com.musicalsniffle.dto.ReservaRequest;
import com.musicalsniffle.dto.ReservaResponse;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.ReservaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class ReservaAdminController {

    private final ReservaService reservaService;
    private final PlazaRepository plazaRepository;

    @GetMapping("/plazas")
    public List<Plaza> listarPlazas() {
        return plazaRepository.findAll();
    }

    @PostMapping("/plazas")
    @ResponseStatus(HttpStatus.CREATED)
    public Plaza crearPlaza(@Valid @RequestBody PlazaRequest request) {
        if (plazaRepository.existsByCodigo(request.getCodigo())) {
            throw new IllegalArgumentException("Ya existe una plaza con ese código");
        }

        Plaza plaza = Plaza.builder()
                .codigo(request.getCodigo())
                .activa(request.isActiva())
                .build();
        return plazaRepository.save(plaza);
    }

    @GetMapping("/reservas")
    public List<ReservaResponse> listarReservas() {
        return reservaService.listarTodas();
    }

    @GetMapping("/reservas/{id}")
    public ReservaResponse obtenerReserva(@PathVariable Long id) {
        return reservaService.obtenerPorId(id);
    }

    @PostMapping("/reservas")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaResponse crearReserva(
            @Valid @RequestBody ReservaRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return reservaService.crear(request, user.getPersona());
    }

    @PutMapping("/reservas/{id}")
    public ReservaResponse actualizarReserva(
            @PathVariable Long id,
            @Valid @RequestBody ReservaRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return reservaService.actualizar(id, request, user.getPersona());
    }

    @PostMapping("/reservas/{id}/cancelar")
    public ReservaResponse cancelarReserva(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        return reservaService.cancelar(id, user.getPersona());
    }

    @PostMapping("/reservas/{id}/pago-mensual")
    public ReservaResponse registrarPagoMensual(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        return reservaService.registrarPagoMensual(id, user.getPersona());
    }
}
