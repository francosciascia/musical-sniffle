package com.musicalsniffle.repository;

import com.musicalsniffle.model.Auto;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AutoRepository extends JpaRepository<Auto, Long> {

    Optional<Auto> findByPatenteIgnoreCase(String patente);

    boolean existsByPatenteIgnoreCase(String patente);

    java.util.List<Auto> findByClienteId(Long clienteId);
}
