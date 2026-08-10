package com.musicalsniffle.service;

import com.musicalsniffle.config.MercadoPagoProperties;
import com.musicalsniffle.dto.CalculoResponse;
import com.musicalsniffle.dto.CerrarEstadiaRequest;
import com.musicalsniffle.dto.MercadoPagoPagoEstadoResponse;
import com.musicalsniffle.dto.MercadoPagoPreferenciaResponse;
import com.musicalsniffle.dto.PagoMensualRequest;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.MedioPago;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.HistorialRepository;
import com.musicalsniffle.repository.ReservaRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
public class MercadoPagoService {

    private final MercadoPagoProperties properties;
    private final ReservaRepository reservaRepository;
    private final EstadiaRepository estadiaRepository;
    private final HistorialRepository historialRepository;
    private final ReservaService reservaService;
    private final EstacionamientoService estacionamientoService;

    public MercadoPagoService(
            MercadoPagoProperties properties,
            ReservaRepository reservaRepository,
            EstadiaRepository estadiaRepository,
            HistorialRepository historialRepository,
            @Lazy ReservaService reservaService,
            @Lazy EstacionamientoService estacionamientoService) {
        this.properties = properties;
        this.reservaRepository = reservaRepository;
        this.estadiaRepository = estadiaRepository;
        this.historialRepository = historialRepository;
        this.reservaService = reservaService;
        this.estacionamientoService = estacionamientoService;
    }

    public boolean isConfigurado() {
        return properties.isEnabled()
                && properties.getAccessToken() != null
                && !properties.getAccessToken().isBlank();
    }

    @Transactional(readOnly = true)
    public MercadoPagoPreferenciaResponse crearPreferenciaAbono(Long reservaId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Abono no encontrado: " + reservaId));

        return crearPreferencia(
                "reserva:" + reserva.getId(),
                "Abono mensual plaza " + reserva.getPlaza().getCodigo(),
                "ABONO " + reserva.getPlaza().getCodigo(),
                reserva.getMontoMensual());
    }

    @Transactional(readOnly = true)
    public MercadoPagoPreferenciaResponse crearPreferenciaEstadia(Long estadiaId) {
        CalculoResponse preview = estacionamientoService.previsualizarCobro(estadiaId);
        if (preview.isAbonado() || preview.getMonto() == null
                || preview.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            return MercadoPagoPreferenciaResponse.builder()
                    .configurado(isConfigurado())
                    .monto(BigDecimal.ZERO)
                    .mensaje("No hay monto a cobrar para esta estadía")
                    .build();
        }

        String plaza = preview.getPlazaCodigo() != null ? preview.getPlazaCodigo() : "S/A";
        return crearPreferencia(
                "estadia:" + estadiaId,
                "Estacionamiento " + preview.getPatente() + " plaza " + plaza,
                "ESTADIA " + preview.getPatente(),
                preview.getMonto());
    }

    /** Polling desde el front: busca pago aprobado y lo aplica solo. */
    @Transactional
    public MercadoPagoPagoEstadoResponse consultarEstadoAbono(Long reservaId) {
        return consultarYAplicar("reserva:" + reservaId);
    }

    @Transactional
    public MercadoPagoPagoEstadoResponse consultarEstadoEstadia(Long estadiaId) {
        return consultarYAplicar("estadia:" + estadiaId);
    }

    /** Webhook MP (también funciona sin body, solo query params). */
    @Transactional
    public void procesarWebhook(String type, String dataId, Map<String, Object> body) {
        String paymentId = dataId;
        String topic = type;

        if (body != null) {
            if (paymentId == null && body.get("data") instanceof Map<?, ?> data) {
                Object id = data.get("id");
                if (id != null) {
                    paymentId = String.valueOf(id);
                }
            }
            if (topic == null && body.get("type") != null) {
                topic = String.valueOf(body.get("type"));
            }
            if (topic == null && body.get("topic") != null) {
                topic = String.valueOf(body.get("topic"));
            }
            if (paymentId == null && body.get("id") != null
                    && ("payment".equals(topic) || "payment".equals(String.valueOf(body.get("type"))))) {
                paymentId = String.valueOf(body.get("id"));
            }
        }

        if (paymentId == null || paymentId.isBlank()) {
            log.info("Webhook MP sin payment id (type={})", topic);
            return;
        }

        if (topic != null && !topic.contains("payment")) {
            log.info("Webhook MP ignorado type={} id={}", topic, paymentId);
            return;
        }

        Map<String, Object> pago = obtenerPago(paymentId);
        aplicarSiAprobado(pago);
    }

    private MercadoPagoPagoEstadoResponse consultarYAplicar(String externalRef) {
        if (!isConfigurado()) {
            return MercadoPagoPagoEstadoResponse.builder()
                    .aprobado(false)
                    .pendiente(false)
                    .mensaje("Mercado Pago no configurado")
                    .externalReference(externalRef)
                    .build();
        }

        List<Map<String, Object>> resultados = buscarPagosPorReferencia(externalRef);
        Map<String, Object> aprobado = null;
        Map<String, Object> pendiente = null;

        for (Map<String, Object> pago : resultados) {
            String status = String.valueOf(pago.get("status"));
            if ("approved".equalsIgnoreCase(status)) {
                aprobado = pago;
                break;
            }
            if ("pending".equalsIgnoreCase(status) || "in_process".equalsIgnoreCase(status)) {
                pendiente = pago;
            }
        }

        if (aprobado != null) {
            boolean procesado = aplicarSiAprobado(aprobado);
            return MercadoPagoPagoEstadoResponse.builder()
                    .aprobado(true)
                    .procesado(procesado)
                    .pendiente(false)
                    .status("approved")
                    .paymentId(String.valueOf(aprobado.get("id")))
                    .externalReference(externalRef)
                    .mensaje(procesado
                            ? "Pago acreditado y registrado automáticamente"
                            : "Pago ya estaba registrado")
                    .build();
        }

        if (pendiente != null) {
            return MercadoPagoPagoEstadoResponse.builder()
                    .aprobado(false)
                    .pendiente(true)
                    .status(String.valueOf(pendiente.get("status")))
                    .paymentId(String.valueOf(pendiente.get("id")))
                    .externalReference(externalRef)
                    .mensaje("Pago pendiente en Mercado Pago")
                    .build();
        }

        return MercadoPagoPagoEstadoResponse.builder()
                .aprobado(false)
                .pendiente(false)
                .status("not_found")
                .externalReference(externalRef)
                .mensaje("Todavía no hay pago para esta preferencia")
                .build();
    }

    private boolean aplicarSiAprobado(Map<String, Object> pago) {
        if (pago == null) {
            return false;
        }
        String status = String.valueOf(pago.get("status"));
        if (!"approved".equalsIgnoreCase(status)) {
            log.info("Pago MP {} status={}", pago.get("id"), status);
            return false;
        }

        String paymentId = String.valueOf(pago.get("id"));
        if (yaProcesado(paymentId)) {
            log.info("Pago MP {} ya procesado", paymentId);
            return false;
        }

        String externalRef = pago.get("external_reference") == null
                ? null
                : String.valueOf(pago.get("external_reference"));
        if (externalRef == null || externalRef.isBlank()) {
            log.warn("Pago MP {} sin external_reference", paymentId);
            return false;
        }

        if (externalRef.startsWith("reserva:")) {
            Long reservaId = Long.valueOf(externalRef.substring("reserva:".length()));
            PagoMensualRequest request = new PagoMensualRequest();
            request.setMedioPago(MedioPago.QR);
            request.setMercadopagoId(paymentId);
            request.setReferenciaComprobante("MP auto " + paymentId);
            reservaService.registrarPagoMensual(reservaId, request, null);
            log.info("Abono {} pagado automáticamente con MP {}", reservaId, paymentId);
            return true;
        }

        if (externalRef.startsWith("estadia:")) {
            Long estadiaId = Long.valueOf(externalRef.substring("estadia:".length()));
            var estadia = estadiaRepository.findById(estadiaId)
                    .orElseThrow(() -> new IllegalArgumentException("Estadía no encontrada: " + estadiaId));
            if (estadia.getEstado() == EstadoEstadia.CERRADA) {
                log.info("Estadía {} ya estaba cerrada (MP {})", estadiaId, paymentId);
                return false;
            }
            CerrarEstadiaRequest request = new CerrarEstadiaRequest();
            request.setMedioPago(MedioPago.QR);
            request.setMercadopagoId(paymentId);
            request.setReferenciaComprobante("MP auto " + paymentId);
            estacionamientoService.cerrarEstadia(estadiaId, null, request);
            log.info("Estadía {} cerrada automáticamente con MP {}", estadiaId, paymentId);
            return true;
        }

        log.warn("external_reference desconocida: {}", externalRef);
        return false;
    }

    private boolean yaProcesado(String paymentId) {
        return historialRepository.existsByDescripcionContainingIgnoreCase("MP " + paymentId)
                || historialRepository.existsByDescripcionContainingIgnoreCase("MP auto " + paymentId);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> obtenerPago(String paymentId) {
        try {
            return RestClient.create()
                    .get()
                    .uri("https://api.mercadopago.com/v1/payments/" + paymentId)
                    .header("Authorization", "Bearer " + properties.getAccessToken().trim())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException(
                    "Error consultando pago MP (" + ex.getStatusCode().value() + "): "
                            + ex.getResponseBodyAsString());
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buscarPagosPorReferencia(String externalRef) {
        String uri = UriComponentsBuilder
                .fromUriString("https://api.mercadopago.com/v1/payments/search")
                .queryParam("external_reference", externalRef)
                .queryParam("sort", "date_created")
                .queryParam("criteria", "desc")
                .build()
                .toUriString();

        try {
            Map<String, Object> resp = RestClient.create()
                    .get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + properties.getAccessToken().trim())
                    .retrieve()
                    .body(Map.class);
            if (resp == null || !(resp.get("results") instanceof List<?> results)) {
                return List.of();
            }
            return results.stream()
                    .filter(Map.class::isInstance)
                    .map(r -> (Map<String, Object>) r)
                    .toList();
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException(
                    "Error buscando pagos MP (" + ex.getStatusCode().value() + "): "
                            + ex.getResponseBodyAsString());
        }
    }

    private MercadoPagoPreferenciaResponse crearPreferencia(
            String externalRef,
            String title,
            String statementDescriptor,
            BigDecimal monto) {

        if (!isConfigurado()) {
            return MercadoPagoPreferenciaResponse.builder()
                    .configurado(false)
                    .monto(monto)
                    .mensaje(
                            "Mercado Pago no está configurado. Poné app.mercadopago.enabled=true "
                                    + "y el access token (TEST-…) en application-local.yml o variable MP_ACCESS_TOKEN.")
                    .build();
        }

        Map<String, Object> item = new HashMap<>();
        item.put("title", title);
        item.put("quantity", 1);
        item.put("currency_id", "ARS");
        item.put("unit_price", monto);

        Map<String, Object> body = new HashMap<>();
        body.put("items", List.of(item));
        body.put("external_reference", externalRef);
        body.put("statement_descriptor", statementDescriptor);
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

            String initPoint = (String) resp.get("init_point");
            String sandboxInitPoint = (String) resp.get("sandbox_init_point");
            boolean sandbox = properties.isSandboxMode();
            String token = properties.getAccessToken() == null ? "" : properties.getAccessToken().trim();

            String checkoutUrl;
            if (token.startsWith("TEST-")) {
                checkoutUrl = sandboxInitPoint != null ? sandboxInitPoint : initPoint;
            } else if (sandbox) {
                checkoutUrl = initPoint != null ? initPoint : sandboxInitPoint;
            } else {
                checkoutUrl = initPoint != null ? initPoint : sandboxInitPoint;
            }

            return MercadoPagoPreferenciaResponse.builder()
                    .configurado(true)
                    .monto(monto)
                    .preferenceId(String.valueOf(resp.get("id")))
                    .initPoint(initPoint)
                    .sandboxInitPoint(sandboxInitPoint)
                    .checkoutUrl(checkoutUrl)
                    .sandbox(sandbox)
                    .externalReference(externalRef)
                    .mensaje(sandbox
                            ? "Modo prueba: el pago se confirma solo cuando Mercado Pago lo acredita."
                            : "Preferencia creada. El pago se registra solo al acreditarse.")
                    .build();
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException(
                    "Error Mercado Pago (" + ex.getStatusCode().value() + "): "
                            + ex.getResponseBodyAsString());
        }
    }
}
