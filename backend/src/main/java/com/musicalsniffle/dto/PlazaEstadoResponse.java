package com.musicalsniffle.dto;

import java.util.List;
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
    /** True si no entra ningún vehículo más (llena). */
    private boolean ocupada;
    /**
     * Hay al menos una moto y todavía cabe otra (hasta motos-por-plaza).
     * El mapa puede mostrar la plaza como usable para una segunda moto.
     */
    private boolean puedeOtraMoto;
    private int vehiculos;
    private boolean reservada;
    private String reservaCliente;
    /** Primera patente (compat). */
    private String patente;
    private List<String> patentes;
    private Long estadiaId;
}
