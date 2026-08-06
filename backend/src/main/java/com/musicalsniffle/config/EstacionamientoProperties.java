package com.musicalsniffle.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.estacionamiento")
@Getter
@Setter
public class EstacionamientoProperties {

    /**
     * Si es true, el operador debe indicar plaza al registrar ingresos de visitantes.
     * Preferí el ajuste en Configuración (DB); esto queda como default de arranque.
     */
    private boolean plazaObligatoria = false;
}
