package com.propertyhub.controller;

import com.propertyhub.model.Lease;
import com.propertyhub.model.Property;
import com.propertyhub.model.User;
import com.propertyhub.repository.PropertyRepository;
import com.propertyhub.repository.LeaseMessageRepository;
import com.propertyhub.model.LeaseMessage;
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
    private final LeaseMessageRepository leaseMessageRepository;

    public LeaseController(LeaseService leaseService, PropertyRepository propertyRepository, UserRepository userRepository, LeaseMessageRepository leaseMessageRepository){
        this.leaseService = leaseService;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.leaseMessageRepository = leaseMessageRepository;
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

    // ====== Simple per-lease chat between owner and tenant ======
    @PreAuthorize("hasAnyRole('TENANT','OWNER','ADMIN')")
    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long id) {
        var lOpt = leaseService.findById(id);
        if (lOpt.isEmpty()) return ResponseEntity.notFound().build();
        var lease = lOpt.get();
        var property = lease.getProperty();
        var ownerEmail = property != null && property.getOwner()!=null ? property.getOwner().getEmail() : null;
        var tenantEmail = lease.getTenantEmail();

        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            boolean isOwner = ownerEmail!=null && email.equalsIgnoreCase(ownerEmail);
            boolean isTenant = tenantEmail!=null && email.equalsIgnoreCase(tenantEmail);
            if (!isOwner && !isTenant) return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(leaseMessageRepository.findByLeaseIdOrderByCreatedAtAsc(id));
    }

    @PreAuthorize("hasAnyRole('TENANT','OWNER','ADMIN')")
    @PostMapping("/{id}/messages")
    public ResponseEntity<?> postMessage(@PathVariable Long id, @RequestBody java.util.Map<String,String> payload) {
        var lOpt = leaseService.findById(id);
        if (lOpt.isEmpty()) return ResponseEntity.notFound().build();
        var lease = lOpt.get();
        var property = lease.getProperty();
        var ownerEmail = property != null && property.getOwner()!=null ? property.getOwner().getEmail() : null;
        var tenantEmail = lease.getTenantEmail();

        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        String email = auth.getName();
        boolean isOwner = ownerEmail!=null && email.equalsIgnoreCase(ownerEmail);
        boolean isTenant = tenantEmail!=null && email.equalsIgnoreCase(tenantEmail);
        if (!isAdmin && !isOwner && !isTenant) return ResponseEntity.status(403).build();

        String msg = payload.getOrDefault("message", "").trim();
        if (msg.isEmpty()) return ResponseEntity.badRequest().body(java.util.Map.of("error","Empty message"));

        LeaseMessage m = new LeaseMessage();
        m.setLease(lease);
        m.setMessage(msg);
        if (isAdmin) m.setSenderRole("ADMIN");
        else if (isOwner) m.setSenderRole("OWNER");
        else m.setSenderRole("TENANT");
        return ResponseEntity.ok(leaseMessageRepository.save(m));
    }
}
