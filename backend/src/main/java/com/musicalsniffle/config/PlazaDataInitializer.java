package com.musicalsniffle.config;

import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.repository.PlazaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(3)
@RequiredArgsConstructor
public class PlazaDataInitializer implements CommandLineRunner {

    private final PlazaRepository plazaRepository;

    @Override
    public void run(String... args) {
        if (plazaRepository.count() > 0) {
            return;
        }

        // 30 plazas piso 1 (6×5) — espacio para abonos + visitas de demo
        for (int i = 1; i <= 30; i++) {
            int index = i - 1;
            plazaRepository.save(Plaza.builder()
                    .codigo("A" + i)
                    .activa(true)
                    .piso(1)
                    .posX(index % 6)
                    .posY(index / 6)
                    .build());
        }
    }
}
