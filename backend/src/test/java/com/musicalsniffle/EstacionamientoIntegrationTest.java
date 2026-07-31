package com.musicalsniffle;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.dto.LoginRequest;
import com.musicalsniffle.model.TipoVehiculo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
class EstacionamientoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void loginAdmin() throws Exception {
        LoginRequest login = new LoginRequest();
        login.setEmail("admin@musicalsniffle.com");
        login.setPassword("admin123");

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        adminToken = objectMapper.readTree(response).get("token").asText();
    }

    @Test
    void noPermiteDobleIngresoDelMismoAuto() throws Exception {
        Long autoId = crearAuto("DUP123");

        registrarIngreso(autoId, null).andExpect(status().isCreated());
        registrarIngreso(autoId, null).andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("ya tiene una estadía abierta")));
    }

    @Test
    void ingresoSinPlazaCuandoNoEsObligatoria() throws Exception {
        Long autoId = crearAuto("SPL001");
        registrarIngreso(autoId, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ticket.codigo").exists());
    }

    private Long crearAuto(String patente) throws Exception {
        AutoRequest request = new AutoRequest();
        request.setPatente(patente);
        request.setTipo(TipoVehiculo.AUTO);
        request.setModelo("Test Model");

        String response = mockMvc.perform(post("/api/autos")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private ResultActions registrarIngreso(Long autoId, Long plazaId) throws Exception {
        var builder = post("/api/estadias")
                .header("Authorization", "Bearer " + adminToken)
                .param("autoId", autoId.toString());
        if (plazaId != null) {
            builder.param("plazaId", plazaId.toString());
        }
        return mockMvc.perform(builder);
    }
}
