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

        for (int i = 1; i <= 10; i++) {
            plazaRepository.save(Plaza.builder()
                    .codigo("P-" + String.format("%02d", i))
                    .activa(true)
                    .build());
        }
    }
}
