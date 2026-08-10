package com.musicalsniffle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MercadoPagoPagoEstadoResponse {

    private boolean aprobado;
    private boolean pendiente;
    private boolean procesado;
    private String status;
    private String paymentId;
    private String externalReference;
    private String mensaje;
}
