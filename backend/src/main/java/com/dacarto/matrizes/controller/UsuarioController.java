package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.Usuario;
import com.dacarto.matrizes.repository.UsuarioRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Usuario>> listar() {
        // Excluindo senha do retorno para segurança. 
        // Idealmente usaríamos um DTO. Para rapidez, vamos apenas limpar o password.
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(usuarios);
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody UsuarioRequest request) {
        if (usuarioRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username já existe");
        }

        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nome(request.getNome())
                .role(request.getRole())
                .build();

        usuarioRepository.save(usuario);
        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable UUID id, @RequestBody UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id).orElseThrow();

        usuario.setNome(request.getNome());
        usuario.setRole(request.getRole());
        
        // Se enviou senha nova, atualiza
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        usuarioRepository.save(usuario);
        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UsuarioRequest {
        private String username;
        private String password;
        private String nome;
        private Usuario.Role role;
    }
}
