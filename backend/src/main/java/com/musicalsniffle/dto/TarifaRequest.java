package com.musicalsniffle.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TarifaRequest {

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal precioPorHora;

    @DecimalMin("0.01")
    private BigDecimal montoMinimo;

    private Integer minutosParaMediaHora;

    private boolean activa = true;
}
