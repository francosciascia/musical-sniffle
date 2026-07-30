package com.musicalsniffle.repository;

import com.musicalsniffle.model.Plaza;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlazaRepository extends JpaRepository<Plaza, Long> {

    boolean existsByCodigo(String codigo);
}
