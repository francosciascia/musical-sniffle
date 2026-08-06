package com.musicalsniffle.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.mercadopago")
public class MercadoPagoProperties {

    /** Activá con access token de prueba/producción. */
    private boolean enabled = false;

    private String accessToken = "";

    /** URL pública donde MP avisará el pago (ngrok en local). */
    private String notificationUrl = "";
}
