package com.musicalsniffle.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicalsniffle.dto.CeldaPlantaDto;
import com.musicalsniffle.model.Planta;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.TipoCeldaPlanta;
import com.musicalsniffle.repository.PlantaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Asegura un registro de planta por cada piso con plazas y, si la estructura está vacía,
 * guarda celdas FORMA bajo cada plaza ya dibujada para no perder el layout.
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class PlantaBootstrap implements CommandLineRunner {

    private final PlantaRepository plantaRepository;
    private final PlazaRepository plazaRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<Plaza> plazas = plazaRepository.findAll();
        Map<Integer, List<Plaza>> porPiso = plazas.stream()
                .collect(Collectors.groupingBy(Plaza::getPiso));

        Set<Integer> pisos = new HashSet<>(porPiso.keySet());
        plantaRepository.findAll().forEach(p -> pisos.add(p.getPiso()));

        for (int piso : pisos) {
            Planta planta = plantaRepository.findByPiso(piso).orElse(null);
            if (planta == null) {
                planta = plantaRepository.save(Planta.builder()
                        .piso(piso)
                        .celdasJson("[]")
                        .gridCols(12)
                        .gridRows(8)
                        .build());
                log.info("Planta creada para piso {}", piso);
            }

            List<Plaza> delPiso = porPiso.getOrDefault(piso, List.of());
            int maxCol = -1;
            int maxRow = -1;
            for (Plaza plaza : delPiso) {
                if (plaza.getPosX() != null) {
                    maxCol = Math.max(maxCol, plaza.getPosX());
                }
                if (plaza.getPosY() != null) {
                    maxRow = Math.max(maxRow, plaza.getPosY());
                }
            }
            try {
                if (planta.getCeldasJson() != null && !planta.getCeldasJson().isBlank()
                        && !planta.getCeldasJson().trim().equals("[]")) {
                    var celdasExistentes = objectMapper.readTree(planta.getCeldasJson());
                    if (celdasExistentes.isArray()) {
                        for (var node : celdasExistentes) {
                            if (node.has("col")) {
                                maxCol = Math.max(maxCol, node.get("col").asInt());
                            }
                            if (node.has("row")) {
                                maxRow = Math.max(maxRow, node.get("row").asInt());
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
                // si el JSON no parsea, igual seguimos con plazas
            }

            int needCols = Math.max(planta.getGridCols(), maxCol + 1);
            int needRows = Math.max(planta.getGridRows(), maxRow + 1);
            needCols = Math.min(80, Math.max(4, needCols));
            needRows = Math.min(50, Math.max(4, needRows));
            if (needCols != planta.getGridCols() || needRows != planta.getGridRows()) {
                planta.setGridCols(needCols);
                planta.setGridRows(needRows);
                plantaRepository.save(planta);
                log.info("Grilla del piso {} ajustada a {}×{}", piso, needCols, needRows);
            }

            if (delPiso.isEmpty()) {
                continue;
            }

            String json = planta.getCeldasJson();
            boolean vacia = json == null || json.isBlank() || json.trim().equals("[]");
            if (!vacia) {
                continue;
            }

            List<CeldaPlantaDto> celdas = new ArrayList<>();
            Set<String> vistos = new HashSet<>();
            for (Plaza plaza : delPiso) {
                if (plaza.getPosX() == null || plaza.getPosY() == null) {
                    continue;
                }
                String key = plaza.getPosX() + "," + plaza.getPosY();
                if (!vistos.add(key)) {
                    continue;
                }
                CeldaPlantaDto celda = new CeldaPlantaDto();
                celda.setCol(plaza.getPosX());
                celda.setRow(plaza.getPosY());
                celda.setTipo(TipoCeldaPlanta.FORMA);
                celdas.add(celda);
            }

            if (celdas.isEmpty()) {
                continue;
            }

            planta.setCeldasJson(objectMapper.writeValueAsString(celdas));
            plantaRepository.save(planta);
            log.info("Estructura del piso {} guardada desde {} plazas existentes", piso, celdas.size());
        }
    }
}
