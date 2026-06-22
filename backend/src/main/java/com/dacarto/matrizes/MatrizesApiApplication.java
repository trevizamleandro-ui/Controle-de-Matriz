package com.dacarto.matrizes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MatrizesApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MatrizesApiApplication.class, args);
    }
}
