package com.musicalsniffle.repository;

import com.musicalsniffle.model.Planta;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantaRepository extends JpaRepository<Planta, Long> {

    Optional<Planta> findByPiso(int piso);
}
