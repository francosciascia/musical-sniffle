package com.musicalsniffle.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AjustesEstacionamientoRequest {

    private boolean plazaObligatoria;
    private boolean permitirDosMotosPorPlaza;

    @Min(0)
    @Max(60)
    private int diasGraciaAbono = 5;

    @Min(0)
    @Max(90)
    private int diasAvisoVencimiento = 7;

    private boolean permitirVisitantePlazaAbonado;
    private boolean avisarAbonoEnGracia = true;

    @Min(0)
    @Max(90)
    private int diasHorizonteCobro = 10;

    @Min(0)
    @Max(90)
    private int diasAtrasoParaSuspender = 10;

    private boolean bloquearIngresoSiSuspendida;
}
