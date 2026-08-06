package com.musicalsniffle.model;

/**
 * Roles de login: {@link #USUARIO} y {@link #ADMINISTRADOR}.
 * {@link #CLIENTE} es solo ficha de abonado/reserva (no inicia sesión).
 */
public enum Rol {
    CLIENTE,
    USUARIO,
    ADMINISTRADOR
}
