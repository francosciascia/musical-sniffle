package com.musicalsniffle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PlazaEstadoResponse {

    private Long id;
    private String codigo;
    private boolean activa;
    private boolean ocupada;
    private String patente;
    private Long estadiaId;
}
