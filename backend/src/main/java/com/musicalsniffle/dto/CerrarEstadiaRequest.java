package com.musicalsniffle.dto;

import com.musicalsniffle.model.MedioPago;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CerrarEstadiaRequest {

    /** Obligatorio si hay monto a cobrar (no abonado). */
    private MedioPago medioPago;

    /** Efectivo: billete/recibido (para calcular vuelto en historial). */
    private BigDecimal montoRecibido;

    /** Transferencia / QR: N° de operación o nota. */
    private String referenciaComprobante;

    /** Preferencia o payment id de Mercado Pago. */
    private String mercadopagoId;
}
