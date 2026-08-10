package com.musicalsniffle.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Sirve el SPA de React (rutas del BrowserRouter) desde el mismo origen que la API.
 */
@Controller
public class SpaForwardController {

    @GetMapping({
            "/",
            "/login",
            "/mapa",
            "/dashboard",
            "/estadias",
            "/historial",
            "/clientes",
            "/config",
            "/config/**",
            "/tarifas",
            "/reservas",
            "/cobros",
            "/diseno-mapa"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
