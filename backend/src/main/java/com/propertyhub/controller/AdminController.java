package com.propertyhub.controller;

import com.propertyhub.model.Property;
import com.propertyhub.service.PropertyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final PropertyService propertyService;
    public AdminController(PropertyService propertyService){this.propertyService = propertyService;}

    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT','AGENT')")
    @GetMapping("/properties")
    public List<Property> allProperties(){ return propertyService.search(null, null, null, null); }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/properties/{id}/toggle")
    public ResponseEntity<Property> toggleAvailability(@PathVariable Long id){
        var pOpt = propertyService.findById(id);
        if(pOpt.isEmpty()) return ResponseEntity.notFound().build();
        Property p = pOpt.get();
        p.setAvailable(!p.isAvailable());
        propertyService.save(p);
        return ResponseEntity.ok(p);
    }
}
