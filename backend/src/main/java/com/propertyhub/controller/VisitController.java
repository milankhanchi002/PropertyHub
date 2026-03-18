package com.propertyhub.controller;

import com.propertyhub.dto.VisitDTO;
import com.propertyhub.model.Visit;
import com.propertyhub.model.Property;
import com.propertyhub.model.ChatMessage;
import com.propertyhub.repository.PropertyRepository;
import com.propertyhub.repository.VisitMessageRepository;
import com.propertyhub.model.VisitMessage;
import com.propertyhub.repository.UserRepository;
import com.propertyhub.service.VisitService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/visits")
public class VisitController {
    private final VisitService visitService;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final VisitMessageRepository visitMessageRepository;

    public VisitController(VisitService visitService, PropertyRepository propertyRepository, UserRepository userRepository, VisitMessageRepository visitMessageRepository, SimpMessagingTemplate messagingTemplate){
        this.visitService = visitService;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.visitMessageRepository = visitMessageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private final SimpMessagingTemplate messagingTemplate;

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

    // Visits related to an owner's properties (any user can see visits for their own properties)
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> byOwner(@PathVariable Long ownerId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        var currentUser = userRepository.findByEmail(email).orElse(null);
        if (currentUser == null || !ownerId.equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: you can only access your own visits"));
        }
        return ResponseEntity.ok(visitService.findDTOByOwnerId(ownerId));
    }

    // Visits for a particular tenant (by email) (any user can see their own visits)
    @GetMapping("/tenant")
    public ResponseEntity<?> byTenant(@RequestParam String email) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();
        if (!currentEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: you can only access your own visits"));
        }
        return ResponseEntity.ok(visitService.findDTOByTenantEmail(email));
    }

    // Update visit status (e.g., PENDING -> APPROVED -> DONE) (property owners can update status)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String value) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        // Check if user owns the property for this visit
        Optional<Visit> vOpt = visitService.findById(id);
        if (vOpt.isEmpty()) return ResponseEntity.notFound().build();
        Visit v = vOpt.get();
        if (v.getProperty() == null || v.getProperty().getOwner() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your property"));
        }
        String ownerEmail = v.getProperty().getOwner().getEmail();
        if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your property"));
        }

        return visitService.updateStatus(id, value)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Owner requests reschedule with a new proposed datetime (property owners can request reschedule)
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> requestReschedule(@PathVariable Long id, @RequestParam String proposedDateTime) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        // Check if user owns the property for this visit
        Optional<Visit> vOpt = visitService.findById(id);
        if (vOpt.isEmpty()) return ResponseEntity.notFound().build();
        Visit v = vOpt.get();
        if (v.getProperty() == null || v.getProperty().getOwner() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your property"));
        }
        String ownerEmail = v.getProperty().getOwner().getEmail();
        if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your property"));
        }
        return ResponseEntity.ok().build();
    }

    // Tenant can mark visit done or pending (tenants can update their own visit status)
    @PutMapping("/{id}/tenant-status")
    public ResponseEntity<?> tenantStatus(@PathVariable Long id, @RequestParam String value) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        // Check if user is the tenant for this visit
        Optional<Visit> vOpt = visitService.findById(id);
        if (vOpt.isEmpty()) return ResponseEntity.notFound().build();
        Visit v = vOpt.get();
        if (v.getTenantEmail() == null || !v.getTenantEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: not your visit"));
        }
        return visitService.updateStatus(id, value)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ====== Simple per-visit chat between owner and tenant ======
    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long id) {
        Optional<Visit> vOpt = visitService.findById(id);
        if (vOpt.isEmpty()) return ResponseEntity.notFound().build();
        Visit v = vOpt.get();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        boolean isOwner = v.getProperty()!=null && v.getProperty().getOwner()!=null && email.equalsIgnoreCase(v.getProperty().getOwner().getEmail());
        boolean isTenant = v.getTenantEmail()!=null && email.equalsIgnoreCase(v.getTenantEmail());
        if (!isOwner && !isTenant) return ResponseEntity.status(403).body(Map.of("error","Forbidden"));
        return ResponseEntity.ok(visitMessageRepository.findByVisitIdOrderByCreatedAtAsc(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> postMessage(@PathVariable Long id, @RequestBody Map<String,String> payload) {
        Optional<Visit> vOpt = visitService.findById(id);
        if (vOpt.isEmpty()) return ResponseEntity.notFound().build();
        Visit v = vOpt.get();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        boolean isOwner = v.getProperty()!=null && v.getProperty().getOwner()!=null && email.equalsIgnoreCase(v.getProperty().getOwner().getEmail());
        boolean isTenant = v.getTenantEmail()!=null && email.equalsIgnoreCase(v.getTenantEmail());
        if (!isOwner && !isTenant) return ResponseEntity.status(403).body(Map.of("error","Forbidden"));

        String msg = payload.getOrDefault("message", "").trim();
        if (msg.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Empty message"));

        // Get sender's name from database
        var senderUser = userRepository.findByEmail(email).orElse(null);
        String senderName = "Unknown User";
        if (senderUser != null) {
            senderName = senderUser.getName();
            System.out.println("Found user: " + email + " with name: " + senderName);
        } else {
            System.out.println("User not found for email: " + email);
        }

        VisitMessage m = new VisitMessage();
        m.setVisit(v);
        m.setMessage(msg);
        m.setSenderName(senderName);
        if (isOwner) m.setSenderRole("OWNER");
        else m.setSenderRole("TENANT");
        
        VisitMessage savedMessage = visitMessageRepository.save(m);
        
        // Send WebSocket message for real-time update
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setType("CHAT");
        chatMessage.setContent(msg);
        chatMessage.setSender(email);
        chatMessage.setChatType("visit");
        chatMessage.setChatId(v.getId());
        chatMessage.setSenderName(senderName);
        
        // Send to specific visit chat room
        messagingTemplate.convertAndSend("/topic/visit/" + v.getId(), chatMessage);
        
        return ResponseEntity.ok(savedMessage);
    }
}
