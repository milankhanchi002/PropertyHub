package com.propertyhub.controller;

import com.propertyhub.dto.PropertyDTO;
import com.propertyhub.model.Property;
import com.propertyhub.model.PropertyType;
import com.propertyhub.model.User;
import com.propertyhub.repository.UserRepository;
import com.propertyhub.service.PropertyService;
import com.propertyhub.repository.VisitRepository;
import com.propertyhub.repository.LeaseRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    @Autowired
    private final PropertyService propertyService;
    private final UserRepository userRepository;
    private final VisitRepository visitRepository;
    private final LeaseRepository leaseRepository;

    public PropertyController(PropertyService propertyService, UserRepository userRepository, VisitRepository visitRepository, LeaseRepository leaseRepository) {
        this.propertyService = propertyService;
        this.userRepository = userRepository;
        this.visitRepository = visitRepository;
        this.leaseRepository = leaseRepository;
    }

    // ✅ Owner's properties (OWNER can only see their own; ADMIN can see any owner's)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Property>> byOwner(@PathVariable Long ownerId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            Optional<User> currentUser = userRepository.findByEmail(email);
            if (currentUser.isEmpty() || !ownerId.equals(currentUser.get().getId())) {
                return ResponseEntity.status(403).build();
            }
        }
        return ResponseEntity.ok(propertyService.findByOwnerId(ownerId));
    }

    // ✅ Toggle availability (ADMIN can toggle any; OWNER can toggle only their own)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Property> toggleAvailability(@PathVariable Long id) {
        Optional<Property> opt = propertyService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r -> r.equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            Optional<User> currentUser = userRepository.findByEmail(email);
            if (currentUser.isEmpty()) return ResponseEntity.status(403).build();
            User user = currentUser.get();
            Property property = opt.get();
            if (property.getOwner() == null || !user.getId().equals(property.getOwner().getId())) {
                return ResponseEntity.status(403).build();
            }
        }

        Property p = opt.get();
        p.setAvailable(!p.isAvailable());
        propertyService.save(p);
        return ResponseEntity.ok(p);
    }
    // ✅ Get properties by city (returns DTOs)
    @GetMapping
    public ResponseEntity<List<PropertyDTO>> getProperties(@RequestParam(required = false) String city) {
        List<PropertyDTO> properties = propertyService.getPropertiesByCity(city);
        return ResponseEntity.ok(properties);
    }

    // ✅ Search with optional filters (separate endpoint)
    @GetMapping("/search")
    public ResponseEntity<List<PropertyDTO>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) BigDecimal min,
            @RequestParam(required = false) BigDecimal max) {

        List<PropertyDTO> properties = propertyService.searchAsDTO(city, type, min, max);
        return ResponseEntity.ok(properties);
    }

    // ✅ Get property by ID
    @GetMapping("/{id}")
    public ResponseEntity<PropertyDTO> getById(@PathVariable Long id) {
        return propertyService.findDTOById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Create new property (OWNER or ADMIN only)
    @PostMapping
    public ResponseEntity<Property> create(@RequestBody Property property, @RequestParam Long ownerId) {
        Optional<User> owner = userRepository.findById(ownerId);
        if (owner.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        property.setOwner(owner.get());
        Property saved = propertyService.save(property);

        return ResponseEntity.ok(saved);
    }

    // ✅ Update property by ID
    @PutMapping("/{id}")
    public ResponseEntity<Property> update(@PathVariable Long id, @RequestBody Property updated) {
        Optional<Property> p = propertyService.findById(id);
        if (p.isEmpty()) return ResponseEntity.notFound().build();

        Property existing = p.get();
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCity(updated.getCity());
        existing.setAddress(updated.getAddress());
        existing.setPrice(updated.getPrice());
        existing.setType(updated.getType());
        existing.setAvailable(updated.isAvailable());

        propertyService.save(existing);
        return ResponseEntity.ok(existing);
    }

    // ✅ Delete property by ID (ADMIN can delete any; OWNER can delete only their own)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<Property> opt = propertyService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // OWNER path: ensure the current user owns this property
            String email = auth.getName();
            Optional<User> currentUser = userRepository.findByEmail(email);
            if (currentUser.isEmpty()) return ResponseEntity.status(403).build();
            User user = currentUser.get();
            Property property = opt.get();
            if (property.getOwner() == null || !user.getId().equals(property.getOwner().getId())) {
                return ResponseEntity.status(403).build();
            }
        }

        // Remove dependents first to avoid referential integrity issues
        visitRepository.deleteByProperty_Id(id);
        leaseRepository.deleteByProperty_Id(id);
        propertyService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Upload images for a property
    @PostMapping("/{id}/images")
    public ResponseEntity<List<String>> uploadImages(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        Optional<Property> pOpt = propertyService.findById(id);
        if (pOpt.isEmpty()) return ResponseEntity.notFound().build();
        Property property = pOpt.get();

        List<String> urls = new ArrayList<>();
        try {
            Path baseDir = Paths.get("uploads", "properties", String.valueOf(id));
            Files.createDirectories(baseDir);

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path target = baseDir.resolve(filename);
                Files.copy(file.getInputStream(), target);
                String publicUrl = "/uploads/properties/" + id + "/" + filename;
                urls.add(publicUrl);
            }

            List<String> existing = property.getImageUrls();
            if (existing == null) existing = new ArrayList<>();
            existing.addAll(urls);
            property.setImageUrls(existing);
            propertyService.save(property);

            return ResponseEntity.ok(urls);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
