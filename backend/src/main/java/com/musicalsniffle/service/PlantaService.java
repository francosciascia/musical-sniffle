package com.musicalsniffle.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicalsniffle.dto.CeldaPlantaDto;
import com.musicalsniffle.dto.CopiarDistribucionResponse;
import com.musicalsniffle.dto.CrearPlantaRequest;
import com.musicalsniffle.dto.PlantaRequest;
import com.musicalsniffle.dto.PlantaResponse;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Planta;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.TipoCeldaPlanta;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.PlantaRepository;
import com.musicalsniffle.repository.ReservaRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlantaService {

    public static final int DEFAULT_GRID_COLS = 12;
    public static final int DEFAULT_GRID_ROWS = 8;
    public static final int MIN_GRID = 4;
    public static final int MAX_GRID_COLS = 80;
    public static final int MAX_GRID_ROWS = 50;

    private final PlantaRepository plantaRepository;
    private final PlazaRepository plazaRepository;
    private final EstadiaRepository estadiaRepository;
    private final ReservaRepository reservaRepository;
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
                .orElse(PlantaResponse.builder()
                        .piso(piso)
                        .gridCols(DEFAULT_GRID_COLS)
                        .gridRows(DEFAULT_GRID_ROWS)
                        .celdas(List.of())
                        .build());
    }

    @Transactional
    public PlantaResponse guardar(int piso, PlantaRequest request) {
        validarCeldas(request.getCeldas());

        Planta planta = plantaRepository.findByPiso(piso)
                .orElse(Planta.builder()
                        .piso(piso)
                        .gridCols(DEFAULT_GRID_COLS)
                        .gridRows(DEFAULT_GRID_ROWS)
                        .build());

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
                    if (celdas.isEmpty()) {
                        return false;
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
        return crearPiso(null);
    }

    @Transactional
    public PlantaResponse crearPiso(CrearPlantaRequest request) {
        int next = plantaRepository.findAll().stream()
                .mapToInt(Planta::getPiso)
                .max()
                .orElse(0) + 1;

        if (plantaRepository.findByPiso(next).isPresent()) {
            throw new IllegalStateException("Ya existe el piso " + next);
        }

        int cols = DEFAULT_GRID_COLS;
        int rows = DEFAULT_GRID_ROWS;
        if (request != null) {
            if (request.getGridCols() != null) {
                cols = clamp(request.getGridCols(), MIN_GRID, MAX_GRID_COLS);
            }
            if (request.getGridRows() != null) {
                rows = clamp(request.getGridRows(), MIN_GRID, MAX_GRID_ROWS);
            }
        }

        Planta planta = plantaRepository.save(Planta.builder()
                .piso(next)
                .celdasJson("[]")
                .gridCols(cols)
                .gridRows(rows)
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

    /**
     * Copia estructura y plazas del piso origen al destino.
     * Reemplaza celdas del destino. Si el destino ya tiene plazas, las borra
     * (solo si no hay estadías abiertas ni reservas activas).
     */
    @Transactional
    public CopiarDistribucionResponse copiarDistribucion(int pisoDestino, int pisoOrigen) {
        if (pisoDestino == pisoOrigen) {
            throw new IllegalArgumentException("Origen y destino deben ser distintos");
        }
        if (pisoOrigen < 1 || pisoDestino < 1) {
            throw new IllegalArgumentException("Piso inválido");
        }

        Planta origen = plantaRepository.findByPiso(pisoOrigen)
                .orElseThrow(() -> new IllegalArgumentException("No existe el piso origen " + pisoOrigen));

        List<Plaza> plazasOrigen = plazaRepository.findAll().stream()
                .filter(p -> p.getPiso() == pisoOrigen)
                .sorted(Comparator
                        .comparing((Plaza p) -> p.getPosY() != null ? p.getPosY() : Integer.MAX_VALUE)
                        .thenComparing(p -> p.getPosX() != null ? p.getPosX() : Integer.MAX_VALUE)
                        .thenComparing(Plaza::getId))
                .toList();

        Planta destino = plantaRepository.findByPiso(pisoDestino)
                .orElseGet(() -> plantaRepository.save(Planta.builder()
                        .piso(pisoDestino)
                        .celdasJson("[]")
                        .gridCols(origen.getGridCols())
                        .gridRows(origen.getGridRows())
                        .build()));

        // Copiar estructura y tamaño de grilla
        destino.setCeldasJson(origen.getCeldasJson() != null ? origen.getCeldasJson() : "[]");
        destino.setGridCols(origen.getGridCols());
        destino.setGridRows(origen.getGridRows());
        destino = plantaRepository.save(destino);

        // Reemplazar plazas del destino
        List<Plaza> plazasDestino = plazaRepository.findAll().stream()
                .filter(p -> p.getPiso() == pisoDestino)
                .toList();

        for (Plaza plaza : plazasDestino) {
            if (estadiaRepository.findByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA).isPresent()) {
                throw new IllegalStateException(
                        "No se puede copiar: hay una estadía abierta en la plaza " + plaza.getCodigo());
            }
            if (reservaRepository.existsByPlazaId(plaza.getId())) {
                throw new IllegalStateException(
                        "No se puede copiar: la plaza " + plaza.getCodigo() + " tiene reservas asociadas");
            }
            estadiaRepository.clearPlazaReference(plaza.getId());
        }

        plazaRepository.deleteAll(plazasDestino);
        plazaRepository.flush();

        String letra = letraPiso(pisoDestino);
        int n = 1;
        int copiadas = 0;
        for (Plaza src : plazasOrigen) {
            plazaRepository.save(Plaza.builder()
                    .codigo(letra + n++)
                    .activa(src.isActiva())
                    .piso(pisoDestino)
                    .posX(src.getPosX())
                    .posY(src.getPosY())
                    .build());
            copiadas++;
        }

        return CopiarDistribucionResponse.builder()
                .planta(toResponse(destino))
                .plazasCopiadas(copiadas)
                .pisoOrigen(pisoOrigen)
                .pisoDestino(pisoDestino)
                .build();
    }

    /** Crea el siguiente piso y copia distribución del anterior (si existe). */
    @Transactional
    public CopiarDistribucionResponse crearPisoCopiandoAnterior() {
        PlantaResponse creado = crearPiso();
        int destino = creado.getPiso();
        int origen = destino - 1;
        if (origen < 1 || plantaRepository.findByPiso(origen).isEmpty()) {
            return CopiarDistribucionResponse.builder()
                    .planta(creado)
                    .plazasCopiadas(0)
                    .pisoOrigen(origen)
                    .pisoDestino(destino)
                    .build();
        }
        return copiarDistribucion(destino, origen);
    }

    static String letraPiso(int piso) {
        int n = Math.max(1, piso);
        if (n <= 26) {
            return String.valueOf((char) ('A' + n - 1));
        }
        StringBuilder sb = new StringBuilder();
        int num = n;
        while (num > 0) {
            num--;
            sb.insert(0, (char) ('A' + (num % 26)));
            num /= 26;
        }
        return sb.toString();
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
                .gridCols(planta.getGridCols() > 0 ? planta.getGridCols() : DEFAULT_GRID_COLS)
                .gridRows(planta.getGridRows() > 0 ? planta.getGridRows() : DEFAULT_GRID_ROWS)
                .celdas(parseCeldas(planta.getCeldasJson()))
                .build();
    }

    private static int clamp(int value, int min, int max) {
        return Math.min(max, Math.max(min, value));
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
