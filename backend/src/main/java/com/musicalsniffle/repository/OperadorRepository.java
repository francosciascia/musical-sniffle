package com.musicalsniffle.repository;

import com.musicalsniffle.model.Operador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperadorRepository extends JpaRepository<Operador, Long> {

    boolean existsByLegajo(String legajo);
}
