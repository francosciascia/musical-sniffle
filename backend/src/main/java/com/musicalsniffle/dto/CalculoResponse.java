package com.musicalsniffle.dto;

import com.musicalsniffle.model.MedioPago;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CalculoResponse {

    private Long estadiaId;
    private String patente;
    private String tipoVehiculo;
    private BigDecimal monto;
    private boolean abonado;
    private String ticketCodigo;
    private String plazaCodigo;
    private LocalDateTime entrada;
    private LocalDateTime salida;
    private MedioPago medioPago;
}
