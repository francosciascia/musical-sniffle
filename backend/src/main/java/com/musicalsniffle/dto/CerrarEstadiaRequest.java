package com.musicalsniffle.dto;

import com.musicalsniffle.model.MedioPago;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CerrarEstadiaRequest {

    /** Obligatorio si hay monto a cobrar (no abonado). */
    private MedioPago medioPago;
}
