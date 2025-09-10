package com.propertyhub.controller;

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
    public ResponseEntity<Visit> bookVisit(@RequestBody Visit visit, @RequestParam Long propertyId){
        Optional<Property> p = propertyRepository.findById(propertyId);
        if(p.isEmpty()) return ResponseEntity.badRequest().build();
        visit.setProperty(p.get());
        visit.setStatus("PENDING");
        Visit saved = visitService.save(visit);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Visit> all(){ return visitService.findAll(); }
}
