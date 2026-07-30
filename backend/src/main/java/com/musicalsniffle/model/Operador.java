package com.musicalsniffle.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "operadores")
@PrimaryKeyJoinColumn(name = "persona_id")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Operador extends Persona {

    @Column(nullable = false, unique = true, length = 20)
    private String legajo;

    @Override
    public Rol getRol() {
        return Rol.OPERADOR;
    }
}
