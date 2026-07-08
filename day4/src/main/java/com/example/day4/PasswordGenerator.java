package com.example.day4;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "Sabari@2962006";

        String encodedPassword = encoder.encode(rawPassword);

        System.out.println("BCrypt Password:");
        System.out.println(encodedPassword);
    }
}