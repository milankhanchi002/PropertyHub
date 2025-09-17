package com.propertyhub.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List; // Make sure to import List

@Entity
@Table(name = "users")
// ✅ ADDED: Prevents errors with Hibernate's lazy-loading proxies
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    @JsonIgnore // Never send the password back in JSON responses
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    // ✅ ADDED: Establishes the other side of the relationship
    // This allows you to easily find all properties owned by a user.
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // CRITICAL: Prevents infinite loop during JSON serialization
    private List<Property> properties;

    // --- Constructors, Getters, and Setters ---

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public List<Property> getProperties() { return properties; }
    public void setProperties(List<Property> properties) { this.properties = properties; }
}