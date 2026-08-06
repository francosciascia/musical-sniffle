package com.musicalsniffle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AjustesEstacionamientoResponse {

    private boolean plazaObligatoria;
    private boolean permitirDosMotosPorPlaza;
    private int motosPorPlaza;

    private int diasGraciaAbono;
    private int diasAvisoVencimiento;
    private boolean permitirVisitantePlazaAbonado;
    private boolean avisarAbonoEnGracia;

    private int diasHorizonteCobro;
    private int diasAtrasoParaSuspender;
    private boolean bloquearIngresoSiSuspendida;
}
