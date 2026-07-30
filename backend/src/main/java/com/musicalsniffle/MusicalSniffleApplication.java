package com.musicalsniffle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MusicalSniffleApplication {

    public static void main(String[] args) {
        SpringApplication.run(MusicalSniffleApplication.class, args);
    }
}
