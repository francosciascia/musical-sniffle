package com.musicalsniffle.controller;

import com.musicalsniffle.dto.TarifaRequest;
import com.musicalsniffle.model.Tarifa;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.TarifaRepository;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.HistorialService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/tarifas")
@RequiredArgsConstructor
public class TarifaController {

    private final TarifaRepository tarifaRepository;
    private final HistorialService historialService;

    @GetMapping
    public List<Tarifa> listar() {
        return tarifaRepository.findAll();
    }

    @GetMapping("/{id}")
    public Tarifa obtener(@PathVariable Long id) {
        return tarifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tarifa no encontrada: " + id));
    }

    @PutMapping("/{id}")
    public Tarifa actualizar(
            @PathVariable Long id,
            @Valid @RequestBody TarifaRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        Tarifa tarifa = tarifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tarifa no encontrada: " + id));

        tarifa.setPrecioPorHora(request.getPrecioPorHora());
        tarifa.setMontoMinimo(request.getMontoMinimo());
        tarifa.setMinutosParaMediaHora(request.getMinutosParaMediaHora());
        tarifa.setPrecioMensual(request.getPrecioMensual());
        tarifa.setActiva(request.isActiva());

        Tarifa guardada = tarifaRepository.save(tarifa);

        historialService.registrar(
                TipoEvento.TARIFA_ACTUALIZADA,
                "Tarifa " + guardada.getTipoVehiculo() + " actualizada"
                        + " ($" + guardada.getPrecioPorHora() + "/h"
                        + (guardada.getPrecioMensual() != null
                                ? ", $" + guardada.getPrecioMensual() + "/mes"
                                : "")
                        + ")",
                user.getPersona(),
                "Tarifa",
                guardada.getId(),
                null);

        return guardada;
    }
}
