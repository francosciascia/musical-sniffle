package com.musicalsniffle.service;

import com.musicalsniffle.config.MercadoPagoProperties;
import com.musicalsniffle.dto.MercadoPagoPreferenciaResponse;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.repository.ReservaRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class MercadoPagoService {

    private final MercadoPagoProperties properties;
    private final ReservaRepository reservaRepository;

    public boolean isConfigurado() {
        return properties.isEnabled()
                && properties.getAccessToken() != null
                && !properties.getAccessToken().isBlank();
    }

    @Transactional(readOnly = true)
    public MercadoPagoPreferenciaResponse crearPreferenciaAbono(Long reservaId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Abono no encontrado: " + reservaId));

        if (!isConfigurado()) {
            return MercadoPagoPreferenciaResponse.builder()
                    .configurado(false)
                    .monto(reserva.getMontoMensual())
                    .mensaje(
                            "Mercado Pago no está configurado. Poné app.mercadopago.enabled=true "
                                    + "y el access token (TEST-…) en application-local.yml o variable MP_ACCESS_TOKEN.")
                    .build();
        }

        String externalRef = "reserva:" + reserva.getId();
        Map<String, Object> item = new HashMap<>();
        item.put("title", "Abono mensual plaza " + reserva.getPlaza().getCodigo());
        item.put("quantity", 1);
        item.put("currency_id", "ARS");
        item.put("unit_price", reserva.getMontoMensual());

        Map<String, Object> body = new HashMap<>();
        body.put("items", List.of(item));
        body.put("external_reference", externalRef);
        body.put(
                "statement_descriptor",
                "ABONO " + reserva.getPlaza().getCodigo());
        if (properties.getNotificationUrl() != null && !properties.getNotificationUrl().isBlank()) {
            body.put("notification_url", properties.getNotificationUrl());
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = RestClient.create()
                    .post()
                    .uri("https://api.mercadopago.com/checkout/preferences")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + properties.getAccessToken().trim())
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (resp == null) {
                throw new IllegalStateException("Mercado Pago no devolvió preferencia");
            }

            return MercadoPagoPreferenciaResponse.builder()
                    .configurado(true)
                    .monto(reserva.getMontoMensual())
                    .preferenceId(String.valueOf(resp.get("id")))
                    .initPoint((String) resp.get("init_point"))
                    .sandboxInitPoint((String) resp.get("sandbox_init_point"))
                    .externalReference(externalRef)
                    .mensaje("Preferencia creada. Abrí el link o mostrá el QR al cliente.")
                    .build();
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException(
                    "Error Mercado Pago (" + ex.getStatusCode().value() + "): "
                            + ex.getResponseBodyAsString());
        }
    }
}
