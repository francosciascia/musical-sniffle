package com.musicalsniffle.dto;

import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.TipoVehiculo;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AutoResponse {

    private Long id;
    private String patente;
    private TipoVehiculo tipo;
    private String modelo;
    /** Compat con el front: { id } del cliente dueño, si hay. */
    private ClienteRef cliente;

    public static AutoResponse from(Auto auto) {
        ClienteRef ref = null;
        if (auto.getCliente() != null) {
            ref = ClienteRef.builder().id(auto.getCliente().getId()).build();
        }
        return AutoResponse.builder()
                .id(auto.getId())
                .patente(auto.getPatente())
                .tipo(auto.getTipo())
                .modelo(auto.getModelo())
                .cliente(ref)
                .build();
    }

    @Getter
    @Builder
    public static class ClienteRef {
        private Long id;
    }
}
