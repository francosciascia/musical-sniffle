-- Nuevas reglas de negocio (valores suaves por defecto para estacionamiento informal).
ALTER TABLE ajustes_estacionamiento
    ADD COLUMN dias_gracia_abono INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN dias_aviso_vencimiento INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN permitir_visitante_plaza_abonado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN avisar_abono_en_gracia BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE ajustes_estacionamiento
    ADD CONSTRAINT ajustes_dias_gracia_chk CHECK (dias_gracia_abono >= 0 AND dias_gracia_abono <= 60),
    ADD CONSTRAINT ajustes_dias_aviso_chk CHECK (dias_aviso_vencimiento >= 0 AND dias_aviso_vencimiento <= 90);
