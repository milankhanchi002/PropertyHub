package com.propertyhub.controller;

import com.propertyhub.dto.VisitDTO;
import com.propertyhub.model.Visit;
import com.propertyhub.model.Property;
import com.propertyhub.repository.PropertyRepository;
import com.propertyhub.repository.UserRepository;
import com.propertyhub.service.VisitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/visits")
public class VisitController {
    private final VisitService visitService;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public VisitController(VisitService visitService, PropertyRepository propertyRepository, UserRepository userRepository){
        this.visitService = visitService;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/book")
    public ResponseEntity<VisitDTO> bookVisit(@RequestBody Visit visit, @RequestParam Long propertyId){
        Optional<Property> p = propertyRepository.findById(propertyId);
        if(p.isEmpty()) return ResponseEntity.badRequest().build();
        visit.setProperty(p.get());
        visit.setStatus("PENDING");
        Visit saved = visitService.save(visit);
        // Map to DTO for response
        VisitDTO dto = new VisitDTO(
                saved.getId(),
                saved.getProperty() != null ? saved.getProperty().getId() : null,
                saved.getProperty() != null ? saved.getProperty().getTitle() : null,
                saved.getTenantName(),
                saved.getTenantEmail(),
                saved.getVisitDateTime(),
                saved.getStatus()
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public List<VisitDTO> all(){ return visitService.findAllDTO(); }

    // Visits related to an owner's properties
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> byOwner(@PathVariable Long ownerId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (!isAdmin) {
            // OWNER must only access their own visits
            String email = auth.getName();
            var currentUser = userRepository.findByEmail(email).orElse(null);
            if (currentUser == null || !ownerId.equals(currentUser.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden: you can only access your own visits"));
            }
        }
        return ResponseEntity.ok(visitService.findDTOByOwnerId(ownerId));
    }

    // Visits for a particular tenant (by email)
    @PreAuthorize("hasAnyRole('TENANT','ADMIN')")
    @GetMapping("/tenant")
    public ResponseEntity<?> byTenant(@RequestParam String email) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (!isAdmin) {
            // TENANT must only access their own visits
            String currentEmail = auth.getName();
            if (!currentEmail.equalsIgnoreCase(email)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden: you can only access your own visits"));
            }
        }
        return ResponseEntity.ok(visitService.findDTOByTenantEmail(email));
    }

    // Update visit status (e.g., PENDING -> DONE)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String value) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // OWNER can only update status for visits on their own properties
            Optional<Visit> vOpt = visitService.findById(id);
            if (vOpt.isEmpty()) return ResponseEntity.notFound().build();
            Visit v = vOpt.get();
            if (v.getProperty() == null || v.getProperty().getOwner() == null) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your property"));
            }
            String ownerEmail = v.getProperty().getOwner().getEmail();
            if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(auth.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your property"));
            }
        }

        return visitService.updateStatus(id, value)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
