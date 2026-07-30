package com.musicalsniffle.config;

import com.musicalsniffle.model.SuperAdmin;
import com.musicalsniffle.repository.SuperAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

    private final SuperAdminRepository superAdminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (superAdminRepository.count() > 0) {
            return;
        }

        SuperAdmin admin = SuperAdmin.builder()
                .nombre("Super")
                .apellido("Admin")
                .dni("00000000")
                .email("admin@musicalsniffle.com")
                .telefono("1100000000")
                .password(passwordEncoder.encode("admin123"))
                .activo(true)
                .build();

        superAdminRepository.save(admin);
    }
}
