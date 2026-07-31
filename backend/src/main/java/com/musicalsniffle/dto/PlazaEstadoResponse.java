package com.musicalsniffle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PlazaEstadoResponse {

    private Long id;
    private String codigo;
    private boolean activa;
    private int piso;
    private Integer posX;
    private Integer posY;
    private boolean ocupada;
    private boolean reservada;
    private String reservaCliente;
    private String patente;
    private Long estadiaId;
}
