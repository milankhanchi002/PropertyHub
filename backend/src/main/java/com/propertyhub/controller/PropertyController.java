package com.propertyhub.controller;

import com.propertyhub.dto.PropertyDTO;
import com.propertyhub.model.Property;
import com.propertyhub.model.PropertyType;
import com.propertyhub.model.User;
import com.propertyhub.repository.UserRepository;
import com.propertyhub.service.PropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    @Autowired
    private final PropertyService propertyService;
    private final UserRepository userRepository;

    public PropertyController(PropertyService propertyService, UserRepository userRepository) {
        this.propertyService = propertyService;
        this.userRepository = userRepository;
    }

    // ✅ Get properties by city (returns DTOs)
    @GetMapping
    public ResponseEntity<List<PropertyDTO>> getProperties(@RequestParam String city) {
        List<PropertyDTO> properties = propertyService.getPropertiesByCity(city);
        return ResponseEntity.ok(properties);
    }

    // ✅ Search with optional filters (separate endpoint)
    @GetMapping("/search")
    public ResponseEntity<List<Property>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) BigDecimal min,
            @RequestParam(required = false) BigDecimal max) {

        List<Property> properties = propertyService.search(city, type, min, max);
        return ResponseEntity.ok(properties);
    }

    // ✅ Get property by ID
    @GetMapping("/{id}")
    public ResponseEntity<Property> getById(@PathVariable Long id) {
        return propertyService.findById(id)
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

    // ✅ Delete property by ID (ADMIN only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        propertyService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
