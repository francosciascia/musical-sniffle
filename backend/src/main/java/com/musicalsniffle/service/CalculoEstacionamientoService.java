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

    /** Cobro por media hora iniciada (fracción de 30 min). */
    static final int BLOQUE_MINUTOS = 30;

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
            case AUTO -> calcularPorBloques(tarifa.getPrecioPorHora(), duracion);
            case CAMIONETA, CAMION -> calcularConMinimo(tarifa, duracion);
            case MOTO -> calcularPorBloques(tarifa.getPrecioPorHora(), duracion);
        };
    }

    /**
     * Precio = (precioPorHora / 2) × cantidad de bloques de 30 min iniciados.
     * Ej: $500/h → $250 cada media hora; 31 min = 2 bloques = $500.
     */
    private BigDecimal calcularPorBloques(BigDecimal precioPorHora, Duration duracion) {
        long bloques = bloquesDeMediaHora(duracion);
        BigDecimal precioMediaHora = precioPorHora
                .divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
        return precioMediaHora
                .multiply(BigDecimal.valueOf(bloques))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularConMinimo(Tarifa tarifa, Duration duracion) {
        BigDecimal monto = calcularPorBloques(tarifa.getPrecioPorHora(), duracion);
        if (tarifa.getMontoMinimo() != null) {
            monto = monto.max(tarifa.getMontoMinimo());
        }
        return monto.setScale(2, RoundingMode.HALF_UP);
    }

    /** Al menos 1 bloque si hubo estadía; redondea hacia arriba cada 30 min. */
    static long bloquesDeMediaHora(Duration duracion) {
        long segundos = Math.max(duracion.getSeconds(), 1);
        long minutos = (segundos + 59) / 60; // minutos iniciados
        return (minutos + BLOQUE_MINUTOS - 1) / BLOQUE_MINUTOS;
    }
}
