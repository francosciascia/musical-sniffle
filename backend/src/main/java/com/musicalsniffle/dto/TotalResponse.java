package com.musicalsniffle.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TotalResponse {

    private BigDecimal totalPagos;
    private BigDecimal totalPagosMensuales;
    private BigDecimal totalGeneral;
}
