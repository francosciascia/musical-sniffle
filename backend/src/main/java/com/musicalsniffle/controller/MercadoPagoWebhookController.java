package com.musicalsniffle.controller;

import com.musicalsniffle.dto.MercadoPagoPagoEstadoResponse;
import com.musicalsniffle.dto.MercadoPagoPreferenciaResponse;
import com.musicalsniffle.service.MercadoPagoService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookController {

    private final MercadoPagoService mercadoPagoService;

    @PostMapping("/api/webhooks/mercadopago")
    public ResponseEntity<Void> recibir(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String id,
            @RequestParam(name = "data.id", required = false) String dataId,
            @RequestBody(required = false) Map<String, Object> body) {

        String resolvedType = type != null ? type : topic;
        String resolvedId = dataId != null ? dataId : id;
        log.info("Webhook Mercado Pago type={} id={} bodyKeys={}",
                resolvedType,
                resolvedId,
                body == null ? null : body.keySet());
        try {
            mercadoPagoService.procesarWebhook(resolvedType, resolvedId, body);
        } catch (Exception ex) {
            log.error("Error procesando webhook MP: {}", ex.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
