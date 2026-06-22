package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.Usuario;
import com.dacarto.matrizes.repository.UsuarioRepository;
import com.dacarto.matrizes.security.JwtTokenProvider;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor

public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(loginRequest.getUsername());
        
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        if (passwordEncoder.matches(loginRequest.getPassword(), usuario.getPassword())) {
            String jwt = tokenProvider.generateToken(usuario.getUsername(), usuario.getRole().name());
            return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, usuario.getUsername(), usuario.getNome(), usuario.getRole().name()));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Senha inválida");
    }

    // Apenas para facilitar a primeira execução
    @PostMapping("/register-initial")
    public ResponseEntity<String> registerInitialAdmin() {
        if (usuarioRepository.findByUsername("admin").isPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Usuário admin já existe no banco real");
        }

        Usuario admin = Usuario.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin"))
                .nome("Administrador do Sistema")
                .role(Usuario.Role.ADMIN)
                .build();

        usuarioRepository.save(admin);
        return ResponseEntity.ok("Usuário Admin (admin/admin) criado com sucesso!");
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class JwtAuthenticationResponse {
        private String accessToken;
        private String tokenType = "Bearer";
        private String username;
        private String nome;
        private String role;

        public JwtAuthenticationResponse(String accessToken, String username, String nome, String role) {
            this.accessToken = accessToken;
            this.username = username;
            this.nome = nome;
            this.role = role;
        }
    }
}
