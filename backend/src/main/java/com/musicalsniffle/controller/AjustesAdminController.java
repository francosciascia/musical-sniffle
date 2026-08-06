package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AjustesEstacionamientoRequest;
import com.musicalsniffle.dto.AjustesEstacionamientoResponse;
import com.musicalsniffle.service.AjustesEstacionamientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ajustes")
@RequiredArgsConstructor
public class AjustesAdminController {

    private final AjustesEstacionamientoService ajustesService;

    @GetMapping
    public AjustesEstacionamientoResponse obtener() {
        return ajustesService.obtener();
    }

    @PutMapping
    public AjustesEstacionamientoResponse actualizar(@Valid @RequestBody AjustesEstacionamientoRequest request) {
        return ajustesService.actualizar(request);
    }
}
