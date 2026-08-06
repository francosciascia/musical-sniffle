package com.musicalsniffle.controller;

import com.musicalsniffle.dto.CopiarDistribucionResponse;
import com.musicalsniffle.dto.CrearPlantaRequest;
import com.musicalsniffle.dto.PlantaRequest;
import com.musicalsniffle.dto.PlantaResponse;
import com.musicalsniffle.service.PlantaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/plantas")
@RequiredArgsConstructor
public class PlantaAdminController {

    private final PlantaService plantaService;

    @GetMapping
    public List<PlantaResponse> listar() {
        return plantaService.listarTodas();
    }

    @GetMapping("/{piso}")
    public PlantaResponse obtener(@PathVariable int piso) {
        return plantaService.obtenerPorPiso(piso);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlantaResponse crearPiso(@Valid @RequestBody(required = false) CrearPlantaRequest request) {
        return plantaService.crearPiso(request);
    }

    /** Crea el siguiente piso copiando estructura y plazas del anterior. */
    @PostMapping("/copiar-anterior")
    @ResponseStatus(HttpStatus.CREATED)
    public CopiarDistribucionResponse crearPisoCopiandoAnterior() {
        return plantaService.crearPisoCopiandoAnterior();
    }

    /** Copia distribución del piso origen al piso destino (reemplaza). */
    @PostMapping("/{piso}/copiar-desde")
    public CopiarDistribucionResponse copiarDesde(
            @PathVariable int piso,
            @RequestParam(defaultValue = "0") int origen) {
        int pisoOrigen = origen > 0 ? origen : piso - 1;
        return plantaService.copiarDistribucion(piso, pisoOrigen);
    }

    @PutMapping("/{piso}")
    public PlantaResponse guardar(@PathVariable int piso, @Valid @RequestBody PlantaRequest request) {
        return plantaService.guardar(piso, request);
    }

    @DeleteMapping("/{piso}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarPiso(@PathVariable int piso) {
        plantaService.eliminarPiso(piso);
    }
}
