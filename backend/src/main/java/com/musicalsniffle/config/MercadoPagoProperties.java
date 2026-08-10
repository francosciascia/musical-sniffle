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

    /**
     * true = credenciales de Pruebas (usar sandbox + cuentas de prueba).
     * false = producción (clientes reales).
     * Si no se setea, se infiere por el prefijo TEST- del token.
     */
    private Boolean sandbox;

    /** URL pública donde MP avisará el pago (ngrok en local). */
    private String notificationUrl = "";

    public boolean isSandboxMode() {
        if (sandbox != null) {
            return sandbox;
        }
        String token = accessToken == null ? "" : accessToken.trim();
        return token.startsWith("TEST-");
    }
}
