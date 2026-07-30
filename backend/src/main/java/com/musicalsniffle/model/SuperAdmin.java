package com.musicalsniffle.model;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "super_admins")
@PrimaryKeyJoinColumn(name = "persona_id")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class SuperAdmin extends Persona {

    @Override
    public Rol getRol() {
        return Rol.SUPER_ADMIN;
    }
}
