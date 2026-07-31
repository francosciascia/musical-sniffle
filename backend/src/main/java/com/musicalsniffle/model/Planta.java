package com.musicalsniffle.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "plantas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Planta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private int piso;

    /** JSON: [{ "col": 0, "row": 1, "tipo": "FORMA" }] */
    @Column(name = "celdas", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String celdasJson = "[]";
}
