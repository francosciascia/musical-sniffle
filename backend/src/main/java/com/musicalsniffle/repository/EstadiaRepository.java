package com.musicalsniffle.repository;

import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Plaza;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstadiaRepository extends JpaRepository<Estadia, Long> {

    Optional<Estadia> findByPlazaAndEstado(Plaza plaza, EstadoEstadia estado);
}
