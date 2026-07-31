package com.musicalsniffle.controller;

import com.musicalsniffle.dto.PlazaRequest;
import com.musicalsniffle.dto.PlazaUpdateRequest;
import com.musicalsniffle.dto.ReservaRequest;
import com.musicalsniffle.dto.ReservaResponse;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.PlantaService;
import com.musicalsniffle.service.ReservaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final EstadiaRepository estadiaRepository;
    private final PlantaService plantaService;

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
        validarPosicionLibre(request.getPiso(), request.getPosX(), request.getPosY(), null);
        validarCeldaForma(request.getPiso(), request.getPosX(), request.getPosY());

        Plaza plaza = Plaza.builder()
                .codigo(request.getCodigo())
                .activa(request.isActiva())
                .piso(request.getPiso())
                .posX(request.getPosX())
                .posY(request.getPosY())
                .build();
        return plazaRepository.save(plaza);
    }

    @PutMapping("/plazas/{id}")
    public Plaza actualizarPlaza(
            @PathVariable Long id,
            @Valid @RequestBody PlazaUpdateRequest request) {
        Plaza plaza = plazaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + id));

        if (!plaza.getCodigo().equals(request.getCodigo())
                && plazaRepository.existsByCodigo(request.getCodigo())) {
            throw new IllegalArgumentException("Ya existe una plaza con ese código");
        }

        validarPosicionLibre(request.getPiso(), request.getPosX(), request.getPosY(), id);
        validarCeldaForma(request.getPiso(), request.getPosX(), request.getPosY());

        plaza.setCodigo(request.getCodigo());
        plaza.setActiva(request.isActiva());
        plaza.setPiso(request.getPiso());
        plaza.setPosX(request.getPosX());
        plaza.setPosY(request.getPosY());
        return plazaRepository.save(plaza);
    }

    @DeleteMapping("/plazas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarPlaza(@PathVariable Long id) {
        Plaza plaza = plazaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + id));

        estadiaRepository.findByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA)
                .ifPresent(e -> {
                    throw new IllegalStateException("No se puede eliminar: la plaza está ocupada");
                });

        reservaService.buscarActivaPorPlaza(id)
                .ifPresent(r -> {
                    throw new IllegalStateException("No se puede eliminar: la plaza tiene reserva activa");
                });

        plazaRepository.delete(plaza);
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

    private void validarPosicionLibre(int piso, Integer posX, Integer posY, Long excluirId) {
        if (posX == null || posY == null) {
            return;
        }

        plazaRepository.findAll().stream()
                .filter(p -> !p.getId().equals(excluirId))
                .filter(p -> p.getPiso() == piso)
                .filter(p -> posX.equals(p.getPosX()) && posY.equals(p.getPosY()))
                .findFirst()
                .ifPresent(p -> {
                    throw new IllegalStateException(
                            "Ya hay una plaza (" + p.getCodigo() + ") en esa posición del piso " + piso);
                });
    }

    private void validarCeldaForma(int piso, Integer posX, Integer posY) {
        if (posX == null || posY == null) {
            return;
        }
        if (!plantaService.existePiso(piso)) {
            throw new IllegalStateException("Primero creá y guardá el piso " + piso + " antes de colocar lugares");
        }
        if (!plantaService.celdaPermitePlaza(piso, posX, posY)) {
            throw new IllegalStateException(
                    "Esa celda no está dentro del contorno del piso. Dibujá el área o elegí otra celda.");
        }
    }
}
