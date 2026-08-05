package com.musicalsniffle.config;

import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.repository.PlazaRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Renombra plazas a A1, A2… / B1, B2… / C1… según el piso.
 * Idempotente: si ya están bien, no toca nada.
 */
@Component
@Order(4)
@RequiredArgsConstructor
@Slf4j
public class PlazaCodigoNormalizer implements CommandLineRunner {

    private final PlazaRepository plazaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Plaza> plazas = plazaRepository.findAll();
        if (plazas.isEmpty()) {
            return;
        }

        Map<Integer, List<Plaza>> porPiso = plazas.stream()
                .collect(Collectors.groupingBy(Plaza::getPiso));

        boolean needsRename = false;
        for (Map.Entry<Integer, List<Plaza>> entry : porPiso.entrySet()) {
            String letra = letraPiso(entry.getKey());
            List<Plaza> ordenadas = ordenar(entry.getValue());
            for (int i = 0; i < ordenadas.size(); i++) {
                String esperado = letra + (i + 1);
                if (!esperado.equalsIgnoreCase(ordenadas.get(i).getCodigo())) {
                    needsRename = true;
                    break;
                }
            }
            if (needsRename) {
                break;
            }
        }

        if (!needsRename) {
            return;
        }

        // Fase 1: códigos temporales para no chocar con UNIQUE
        for (Plaza plaza : plazas) {
            plaza.setCodigo("__TMP_" + plaza.getId());
        }
        plazaRepository.saveAll(plazas);
        plazaRepository.flush();

        // Fase 2: A1, B1, C1…
        int total = 0;
        for (Map.Entry<Integer, List<Plaza>> entry : porPiso.entrySet()) {
            String letra = letraPiso(entry.getKey());
            List<Plaza> ordenadas = ordenar(entry.getValue());
            for (int i = 0; i < ordenadas.size(); i++) {
                ordenadas.get(i).setCodigo(letra + (i + 1));
                total++;
            }
        }
        plazaRepository.saveAll(plazas);
        log.info("Plazas renombradas a código por piso (A1/B1/C1…): {} plazas", total);
    }

    private static List<Plaza> ordenar(List<Plaza> lista) {
        return lista.stream()
                .sorted(Comparator
                        .comparing((Plaza p) -> p.getPosY() != null ? p.getPosY() : Integer.MAX_VALUE)
                        .thenComparing(p -> p.getPosX() != null ? p.getPosX() : Integer.MAX_VALUE)
                        .thenComparing(Plaza::getId))
                .toList();
    }

    /** 1→A, 2→B, 3→C… */
    static String letraPiso(int piso) {
        int n = Math.max(1, piso);
        if (n <= 26) {
            return String.valueOf((char) ('A' + n - 1));
        }
        StringBuilder sb = new StringBuilder();
        int num = n;
        while (num > 0) {
            num--;
            sb.insert(0, (char) ('A' + (num % 26)));
            num /= 26;
        }
        return sb.toString();
    }
}
