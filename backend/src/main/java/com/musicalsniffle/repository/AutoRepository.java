package com.musicalsniffle.repository;

import com.musicalsniffle.model.Auto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AutoRepository extends JpaRepository<Auto, Long> {

    Optional<Auto> findByPatenteIgnoreCase(String patente);

    boolean existsByPatenteIgnoreCase(String patente);

    @Query("SELECT a FROM Auto a LEFT JOIN FETCH a.cliente WHERE a.cliente.id = :clienteId")
    List<Auto> findByClienteId(@Param("clienteId") Long clienteId);

    @Query("SELECT a FROM Auto a LEFT JOIN FETCH a.cliente")
    List<Auto> findAllWithCliente();
}
