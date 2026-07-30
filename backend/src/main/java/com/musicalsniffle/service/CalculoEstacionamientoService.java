package com.musicalsniffle.service;

import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Tarifa;
import com.musicalsniffle.model.TipoVehiculo;
import com.musicalsniffle.repository.TarifaRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CalculoEstacionamientoService {

    private static final BigDecimal MINUTOS_POR_HORA = BigDecimal.valueOf(60);

    private final TarifaRepository tarifaRepository;

    public BigDecimal calcular(Estadia estadia) {
        if (estadia.isAbonado()) {
            return BigDecimal.ZERO;
        }

        TipoVehiculo tipo = estadia.getAuto().getTipo();
        Tarifa tarifa = tarifaRepository.findByTipoVehiculoAndActivaTrue(tipo)
                .orElseThrow(() -> new IllegalStateException("No hay tarifa activa para: " + tipo));

        Duration duracion = Duration.between(estadia.getEntrada(), estadia.getSalida());

        return switch (tipo) {
            case AUTO -> calcularPorHora(tarifa.getPrecioPorHora(), duracion);
            case CAMIONETA -> calcularConMinimo(tarifa, duracion);
            case MOTO -> calcularMoto(tarifa, duracion);
            case CAMION -> calcularConMinimo(tarifa, duracion);
        };
    }

    private BigDecimal calcularPorHora(BigDecimal precioPorHora, Duration duracion) {
        long minutos = Math.max(duracion.toMinutes(), 1);
        BigDecimal horas = BigDecimal.valueOf(minutos)
                .divide(MINUTOS_POR_HORA, 4, RoundingMode.HALF_UP);
        return precioPorHora.multiply(horas).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularConMinimo(Tarifa tarifa, Duration duracion) {
        BigDecimal monto = calcularPorHora(tarifa.getPrecioPorHora(), duracion);
        if (tarifa.getMontoMinimo() != null) {
            monto = monto.max(tarifa.getMontoMinimo());
        }
        return monto.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularMoto(Tarifa tarifa, Duration duracion) {
        long minutos = Math.max(duracion.toMinutes(), 1);
        Integer limiteMediaHora = tarifa.getMinutosParaMediaHora();

        if (limiteMediaHora != null && minutos <= limiteMediaHora) {
            return tarifa.getPrecioPorHora()
                    .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }

        return calcularPorHora(tarifa.getPrecioPorHora(), duracion);
    }
}
