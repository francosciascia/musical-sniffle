package com.musicalsniffle.dto;

import java.math.BigDecimal;
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
}
