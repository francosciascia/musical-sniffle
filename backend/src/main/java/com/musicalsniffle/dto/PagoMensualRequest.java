package com.musicalsniffle.dto;

import com.musicalsniffle.model.MedioPago;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PagoMensualRequest {

    @NotNull
    private MedioPago medioPago;

    /** Efectivo: billete/monto que entregó el cliente (null = paga exacto). */
    private BigDecimal montoRecibido;

    /** Transferencia / QR: N° de comprobante u operación. */
    private String referenciaComprobante;

    /** ID de preferencia/pago Mercado Pago si aplica. */
    private String mercadopagoId;
}
