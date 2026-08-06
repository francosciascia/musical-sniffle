package com.musicalsniffle.controller;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Webhook Mercado Pago (sandbox/prod). Por ahora solo registra el aviso;
 * la confirmación operativa sigue siendo desde el modal (o se completa después).
 */
@RestController
@RequestMapping("/api/webhooks/mercadopago")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookController {

    @PostMapping
    public ResponseEntity<Void> recibir(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String data_id,
            @RequestBody(required = false) Map<String, Object> body) {

        log.info("Webhook Mercado Pago type={} data_id={} body={}", type, data_id, body);
        // Próximo paso: consultar pago en MP, leer external_reference=reserva:ID y marcar pagado.
        return ResponseEntity.ok().build();
    }
}
