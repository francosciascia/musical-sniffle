package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.dto.AutoResponse;
import com.musicalsniffle.dto.CalculoResponse;
import com.musicalsniffle.dto.CerrarEstadiaRequest;
import com.musicalsniffle.dto.EstadiaResponse;
import com.musicalsniffle.dto.MercadoPagoPagoEstadoResponse;
import com.musicalsniffle.dto.MercadoPagoPreferenciaResponse;
import com.musicalsniffle.dto.TicketResponse;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.EstacionamientoService;
import com.musicalsniffle.service.MercadoPagoService;
import com.musicalsniffle.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EstacionamientoController {

    private final EstacionamientoService estacionamientoService;
    private final TicketService ticketService;
    private final MercadoPagoService mercadoPagoService;

    @GetMapping("/autos")
    public List<AutoResponse> listarAutos() {
        return estacionamientoService.listarAutos().stream().map(AutoResponse::from).toList();
    }

    @PostMapping("/autos")
    @ResponseStatus(HttpStatus.CREATED)
    public AutoResponse crearAuto(
            @Valid @RequestBody AutoRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return AutoResponse.from(estacionamientoService.crearAuto(request, user.getPersona()));
    }

    @GetMapping("/estadias/{id}/calculo")
    public CalculoResponse previsualizarCobro(@PathVariable Long id) {
        return estacionamientoService.previsualizarCobro(id);
    }

    @PostMapping("/estadias/{id}/mercadopago-preferencia")
    public MercadoPagoPreferenciaResponse preferenciaEgreso(@PathVariable Long id) {
        return mercadoPagoService.crearPreferenciaEstadia(id);
    }

    @GetMapping("/estadias/{id}/mercadopago-estado")
    public MercadoPagoPagoEstadoResponse estadoPagoEgreso(@PathVariable Long id) {
        return mercadoPagoService.consultarEstadoEstadia(id);
    }

    @PostMapping("/estadias/{id}/cerrar")
    public CalculoResponse cerrarEstadia(
            @PathVariable Long id,
            @RequestBody(required = false) CerrarEstadiaRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return estacionamientoService.cerrarEstadia(id, user.getPersona(), request);
    }

    @PostMapping("/estadias")
    @ResponseStatus(HttpStatus.CREATED)
    public EstadiaResponse registrarIngreso(
            @RequestParam Long autoId,
            @RequestParam(required = false) Long plazaId,
            @RequestParam(required = false) Long clienteId,
            @AuthenticationPrincipal UserPrincipal user) {
        return estacionamientoService.registrarIngreso(autoId, plazaId, clienteId, user.getPersona());
    }

    @GetMapping("/estadias/{id}/ticket")
    public TicketResponse obtenerTicket(@PathVariable Long id) {
        return ticketService.buscarPorEstadiaId(id);
    }
}
