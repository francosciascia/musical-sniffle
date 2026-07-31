package com.musicalsniffle.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicalsniffle.dto.CeldaPlantaDto;
import com.musicalsniffle.dto.PlantaRequest;
import com.musicalsniffle.dto.PlantaResponse;
import com.musicalsniffle.model.Planta;
import com.musicalsniffle.model.TipoCeldaPlanta;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.PlantaRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlantaService {

    private final PlantaRepository plantaRepository;
    private final PlazaRepository plazaRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<PlantaResponse> listarTodas() {
        return plantaRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlantaResponse obtenerPorPiso(int piso) {
        return plantaRepository.findByPiso(piso)
                .map(this::toResponse)
                .orElse(PlantaResponse.builder().piso(piso).celdas(List.of()).build());
    }

    @Transactional
    public PlantaResponse guardar(int piso, PlantaRequest request) {
        validarCeldas(request.getCeldas());

        Planta planta = plantaRepository.findByPiso(piso)
                .orElse(Planta.builder().piso(piso).build());

        planta.setCeldasJson(toJson(normalizarCeldas(request.getCeldas())));
        Planta guardada = plantaRepository.save(planta);
        return toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public boolean existePiso(int piso) {
        return plantaRepository.findByPiso(piso).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean celdaPermitePlaza(int piso, int col, int row) {
        return plantaRepository.findByPiso(piso)
                .map(planta -> {
                    List<CeldaPlantaDto> celdas = parseCeldas(planta.getCeldasJson());
                    boolean hayContorno = celdas.stream()
                            .anyMatch(c -> c.getTipo() == TipoCeldaPlanta.FORMA);
                    if (!hayContorno) {
                        return true;
                    }
                    return celdas.stream()
                            .anyMatch(c -> c.getCol() == col
                                    && c.getRow() == row
                                    && c.getTipo() == TipoCeldaPlanta.FORMA);
                })
                .orElse(false);
    }

    @Transactional
    public PlantaResponse crearPiso() {
        int next = plantaRepository.findAll().stream()
                .mapToInt(Planta::getPiso)
                .max()
                .orElse(0) + 1;

        if (plantaRepository.findByPiso(next).isPresent()) {
            throw new IllegalStateException("Ya existe el piso " + next);
        }

        Planta planta = plantaRepository.save(Planta.builder()
                .piso(next)
                .celdasJson("[]")
                .build());
        return toResponse(planta);
    }

    @Transactional
    public void eliminarPiso(int piso) {
        Planta planta = plantaRepository.findByPiso(piso)
                .orElseThrow(() -> new IllegalArgumentException("Piso no encontrado: " + piso));

        boolean tienePlazas = plazaRepository.findAll().stream()
                .anyMatch(p -> p.getPiso() == piso);
        if (tienePlazas) {
            throw new IllegalStateException("No se puede eliminar el piso " + piso + ": tiene plazas asignadas");
        }

        plantaRepository.delete(planta);
    }

    private void validarCeldas(List<CeldaPlantaDto> celdas) {
        if (celdas == null) {
            return;
        }
        for (CeldaPlantaDto celda : celdas) {
            if (celda.getCol() == null || celda.getRow() == null || celda.getTipo() == null) {
                throw new IllegalArgumentException("Cada celda debe tener col, row y tipo");
            }
        }
    }

    private List<CeldaPlantaDto> normalizarCeldas(List<CeldaPlantaDto> celdas) {
        Map<String, CeldaPlantaDto> unicas = new LinkedHashMap<>();
        for (CeldaPlantaDto celda : celdas) {
            unicas.put(celda.getCol() + "," + celda.getRow(), celda);
        }
        return new ArrayList<>(unicas.values());
    }

    private PlantaResponse toResponse(Planta planta) {
        return PlantaResponse.builder()
                .piso(planta.getPiso())
                .celdas(parseCeldas(planta.getCeldasJson()))
                .build();
    }

    private List<CeldaPlantaDto> parseCeldas(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo leer la forma del piso", e);
        }
    }

    private String toJson(List<CeldaPlantaDto> celdas) {
        try {
            return objectMapper.writeValueAsString(celdas);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo guardar la forma del piso", e);
        }
    }
}
