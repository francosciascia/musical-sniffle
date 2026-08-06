package com.musicalsniffle.config;

import com.musicalsniffle.model.Tarifa;
import com.musicalsniffle.model.TipoVehiculo;
import com.musicalsniffle.repository.TarifaRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
public class TarifaDataInitializer implements CommandLineRunner {

    private final TarifaRepository tarifaRepository;

    @Override
    public void run(String... args) {
        if (tarifaRepository.count() > 0) {
            return;
        }

        tarifaRepository.save(Tarifa.builder()
                .tipoVehiculo(TipoVehiculo.AUTO)
                .precioPorHora(new BigDecimal("500"))
                .precioMensual(new BigDecimal("45000"))
                .activa(true)
                .build());

        tarifaRepository.save(Tarifa.builder()
                .tipoVehiculo(TipoVehiculo.CAMIONETA)
                .precioPorHora(new BigDecimal("700"))
                .montoMinimo(new BigDecimal("800"))
                .precioMensual(new BigDecimal("50000"))
                .activa(true)
                .build());

        tarifaRepository.save(Tarifa.builder()
                .tipoVehiculo(TipoVehiculo.MOTO)
                .precioPorHora(new BigDecimal("300"))
                .minutosParaMediaHora(30)
                .precioMensual(new BigDecimal("30000"))
                .activa(true)
                .build());

        tarifaRepository.save(Tarifa.builder()
                .tipoVehiculo(TipoVehiculo.CAMION)
                .precioPorHora(new BigDecimal("1200"))
                .montoMinimo(new BigDecimal("2000"))
                .precioMensual(new BigDecimal("80000"))
                .activa(true)
                .build());
    }
}
