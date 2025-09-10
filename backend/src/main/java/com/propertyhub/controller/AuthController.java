package com.propertyhub.controller;

import com.propertyhub.model.Role;
import com.propertyhub.model.User;
import com.propertyhub.repository.UserRepository;
import com.propertyhub.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")  // Allow frontend
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, BCryptPasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user){
        if(userRepository.findByEmail(user.getEmail()).isPresent()){
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        // Force role as OWNER for testing
        user.setRole(Role.OWNER);

        // Encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Save user
        User saved = userRepository.save(user);

        // Generate JWT
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name());

        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "role", saved.getRole()
        ));

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,String> login){
        String email = login.get("email");
        String password = login.get("password");

        User user = userRepository.findByEmail(email).orElse(null);
        if(user == null || !passwordEncoder.matches(password, user.getPassword())){
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        Map<String,Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));

        return ResponseEntity.ok(resp);
    }
}
