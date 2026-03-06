package com.tokenapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.tokenapp")
public class TokenAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(TokenAppApplication.class, args);
    }

}

