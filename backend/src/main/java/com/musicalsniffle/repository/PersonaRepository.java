package com.musicalsniffle.repository;

import com.musicalsniffle.model.Persona;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonaRepository extends JpaRepository<Persona, Long> {

    Optional<Persona> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByDni(String dni);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByDniAndIdNot(String dni, Long id);
}
