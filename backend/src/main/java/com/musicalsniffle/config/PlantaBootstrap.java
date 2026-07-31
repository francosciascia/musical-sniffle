package com.musicalsniffle.config;

import com.musicalsniffle.model.Planta;
import com.musicalsniffle.repository.PlantaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Crea registros de piso para plazas que ya existían antes de guardar plantas. */
@Component
@Order(4)
@RequiredArgsConstructor
public class PlantaBootstrap implements CommandLineRunner {

    private final PlantaRepository plantaRepository;
    private final PlazaRepository plazaRepository;

    @Override
    public void run(String... args) {
        Set<Integer> pisos = new HashSet<>();
        plazaRepository.findAll().forEach(p -> pisos.add(p.getPiso()));

        for (int piso : pisos) {
            if (plantaRepository.findByPiso(piso).isEmpty()) {
                plantaRepository.save(Planta.builder()
                        .piso(piso)
                        .celdasJson("[]")
                        .build());
            }
        }
    }
}
