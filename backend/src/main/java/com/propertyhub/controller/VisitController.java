package com.propertyhub.controller;

import com.propertyhub.dto.VisitDTO;
import com.propertyhub.model.Visit;
import com.propertyhub.model.Property;
import com.propertyhub.repository.PropertyRepository;
import com.propertyhub.service.VisitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/visits")
public class VisitController {
    private final VisitService visitService;
    private final PropertyRepository propertyRepository;

    public VisitController(VisitService visitService, PropertyRepository propertyRepository){
        this.visitService = visitService;
        this.propertyRepository = propertyRepository;
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
}
