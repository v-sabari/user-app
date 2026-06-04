package com.example.day4;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class CustomUserDetailsConfig {

    @Bean
    public UserDetailsService userDetailsService() {

        UserDetails admin =
                org.springframework.security.core.userdetails.User
                        .builder()
                        .username("admin@gmail.com")
                        .password("{noop}admin123")
                        .roles("ADMIN")
                        .build();

        UserDetails user =
                org.springframework.security.core.userdetails.User
                        .builder()
                        .username("user@gmail.com")
                        .password("{noop}user123")
                        .roles("USER")
                        .build();

        return new InMemoryUserDetailsManager(admin, user);
    }
}