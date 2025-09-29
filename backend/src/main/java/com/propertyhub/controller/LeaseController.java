package com.propertyhub.controller;

import com.propertyhub.model.Lease;
import com.propertyhub.model.Property;
import com.propertyhub.model.User;
import com.propertyhub.repository.PropertyRepository;
import com.propertyhub.repository.UserRepository;
import com.propertyhub.service.LeaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import com.propertyhub.dto.LeaseDTO;

@RestController
@RequestMapping("/api/leases")
public class LeaseController {
    private final LeaseService leaseService;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public LeaseController(LeaseService leaseService, PropertyRepository propertyRepository, UserRepository userRepository){
        this.leaseService = leaseService;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<LeaseDTO> createLease(@RequestBody Lease lease, @RequestParam Long propertyId){
        Optional<Property> p = propertyRepository.findById(propertyId);
        if(p.isEmpty()) return ResponseEntity.badRequest().build();
        lease.setProperty(p.get());
        lease.setStatus("DRAFT");
        Lease saved = leaseService.save(lease);
        return ResponseEntity.ok(leaseService.toDTOResponse(saved));
    }

    @GetMapping
    public ResponseEntity<List<LeaseDTO>> all(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (isAdmin) {
            return ResponseEntity.ok(leaseService.findAllDTO());
        }
        // If OWNER: return leases for properties owned by the current user
        // If TENANT: return their own leases by email
        String email = auth.getName();
        Optional<User> currentUser = userRepository.findByEmail(email);
        if (currentUser.isEmpty()) return ResponseEntity.ok(java.util.Collections.emptyList());
        User user = currentUser.get();
        var authorities = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        if (authorities.contains("ROLE_OWNER")) {
            return ResponseEntity.ok(leaseService.findByOwnerIdDTO(user.getId()));
        }
        if (authorities.contains("ROLE_TENANT")) {
            return ResponseEntity.ok(leaseService.findByTenantEmailDTO(user.getEmail()));
        }
        // default: nothing
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

    // Update lease status (OWNER of the property or ADMIN)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @PutMapping("/{id}/status")
    public ResponseEntity<LeaseDTO> updateStatus(@PathVariable Long id, @RequestParam String value){
        Optional<Lease> lOpt = leaseService.findById(id);
        if (lOpt.isEmpty()) return ResponseEntity.notFound().build();

        Lease lease = lOpt.get();
        Property property = lease.getProperty();
        if (property == null) return ResponseEntity.badRequest().build();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            Optional<User> currentUser = userRepository.findByEmail(email);
            if (currentUser.isEmpty() || property.getOwner() == null || !currentUser.get().getId().equals(property.getOwner().getId())) {
                return ResponseEntity.status(403).build();
            }
        }

        // Accept only known statuses
        String upper = value == null ? "" : value.trim().toUpperCase();
        if (!(upper.equals("DRAFT") || upper.equals("APPROVED") || upper.equals("REJECTED"))) {
            return ResponseEntity.badRequest().build();
        }
        lease.setStatus(upper);
        Lease saved = leaseService.save(lease);
        return ResponseEntity.ok(leaseService.toDTOResponse(saved));
    }
}
