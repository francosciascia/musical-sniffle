package com.musicalsniffle.controller;

import com.musicalsniffle.dto.MercadoPagoPagoEstadoResponse;
import com.musicalsniffle.dto.MercadoPagoPreferenciaResponse;
import com.musicalsniffle.service.MercadoPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reservas")
@RequiredArgsConstructor
public class MercadoPagoAdminController {

    private final MercadoPagoService mercadoPagoService;

    @PostMapping("/{id}/mercadopago-preferencia")
    public MercadoPagoPreferenciaResponse crearPreferencia(@PathVariable Long id) {
        return mercadoPagoService.crearPreferenciaAbono(id);
    }

    /** El front consulta cada pocos segundos; si MP acreditó, se registra solo. */
    @GetMapping("/{id}/mercadopago-estado")
    public MercadoPagoPagoEstadoResponse estadoPago(@PathVariable Long id) {
        return mercadoPagoService.consultarEstadoAbono(id);
    }
}
