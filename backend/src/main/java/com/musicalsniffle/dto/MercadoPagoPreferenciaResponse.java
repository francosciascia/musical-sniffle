package com.musicalsniffle.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MercadoPagoPreferenciaResponse {

    private boolean configurado;
    private String mensaje;
    private String preferenceId;
    private String initPoint;
    private String sandboxInitPoint;
    private BigDecimal monto;
    private String externalReference;
}
