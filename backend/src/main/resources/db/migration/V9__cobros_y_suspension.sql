ALTER TABLE ajustes_estacionamiento
    ADD COLUMN dias_horizonte_cobro INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN dias_atraso_para_suspender INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN bloquear_ingreso_si_suspendida BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE ajustes_estacionamiento
    ADD CONSTRAINT ajustes_horizonte_cobro_chk CHECK (dias_horizonte_cobro >= 0 AND dias_horizonte_cobro <= 90),
    ADD CONSTRAINT ajustes_atraso_suspender_chk CHECK (dias_atraso_para_suspender >= 0 AND dias_atraso_para_suspender <= 90);
