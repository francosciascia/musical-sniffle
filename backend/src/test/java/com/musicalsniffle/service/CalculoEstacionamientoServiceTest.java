package com.musicalsniffle.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Tarifa;
import com.musicalsniffle.model.TipoVehiculo;
import com.musicalsniffle.repository.TarifaRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CalculoEstacionamientoServiceTest {

    @Mock
    private TarifaRepository tarifaRepository;

    private CalculoEstacionamientoService service;

    @BeforeEach
    void setUp() {
        service = new CalculoEstacionamientoService(tarifaRepository);
    }

    @Test
    void abonadoNoPaga() {
        Estadia estadia = estadia(TipoVehiculo.AUTO, 120, true);
        assertEquals(BigDecimal.ZERO, service.calcular(estadia));
    }

    @Test
    void autoCobraPorHora() {
        mockTarifa(TipoVehiculo.AUTO, "500", null, null);
        Estadia estadia = estadia(TipoVehiculo.AUTO, 60, false);
        assertEquals(new BigDecimal("500.00"), service.calcular(estadia));
    }

    @Test
    void camionetaTieneMinimo() {
        mockTarifa(TipoVehiculo.CAMIONETA, "700", "800", null);
        Estadia estadia = estadia(TipoVehiculo.CAMIONETA, 10, false);
        assertEquals(new BigDecimal("800.00"), service.calcular(estadia));
    }

    @Test
    void motoCobraMediaHoraSiEsCorta() {
        mockTarifa(TipoVehiculo.MOTO, "300", null, 30);
        Estadia estadia = estadia(TipoVehiculo.MOTO, 20, false);
        assertEquals(new BigDecimal("150.00"), service.calcular(estadia));
    }

    @Test
    void camionTieneMinimoAlto() {
        mockTarifa(TipoVehiculo.CAMION, "1200", "2000", null);
        Estadia estadia = estadia(TipoVehiculo.CAMION, 15, false);
        assertEquals(new BigDecimal("2000.00"), service.calcular(estadia));
    }

    private void mockTarifa(TipoVehiculo tipo, String precioHora, String minimo, Integer minutosMediaHora) {
        Tarifa tarifa = Tarifa.builder()
                .tipoVehiculo(tipo)
                .precioPorHora(new BigDecimal(precioHora))
                .montoMinimo(minimo != null ? new BigDecimal(minimo) : null)
                .minutosParaMediaHora(minutosMediaHora)
                .activa(true)
                .build();

        when(tarifaRepository.findByTipoVehiculoAndActivaTrue(tipo)).thenReturn(Optional.of(tarifa));
    }

    private Estadia estadia(TipoVehiculo tipo, int minutos, boolean abonado) {
        LocalDateTime entrada = LocalDateTime.of(2026, 7, 30, 10, 0);
        Auto auto = Auto.builder().patente("ABC123").tipo(tipo).build();
        return Estadia.builder()
                .auto(auto)
                .entrada(entrada)
                .salida(entrada.plusMinutes(minutos))
                .estado(EstadoEstadia.CERRADA)
                .abonado(abonado)
                .build();
    }
}
