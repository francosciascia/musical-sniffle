package com.musicalsniffle.controller;

import com.musicalsniffle.dto.PlantaResponse;
import com.musicalsniffle.service.PlantaService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operador/plantas")
@RequiredArgsConstructor
public class PlantaOperadorController {

    private final PlantaService plantaService;

    @GetMapping
    public List<PlantaResponse> listar() {
        return plantaService.listarTodas();
    }

    @GetMapping("/{piso}")
    public PlantaResponse obtener(@PathVariable int piso) {
        return plantaService.obtenerPorPiso(piso);
    }
}
