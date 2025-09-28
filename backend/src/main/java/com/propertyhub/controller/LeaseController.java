package com.propertyhub.controller;

import com.propertyhub.model.Lease;
import com.propertyhub.model.Property;
import com.propertyhub.repository.PropertyRepository;
import com.propertyhub.service.LeaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import com.propertyhub.dto.LeaseDTO;

@RestController
@RequestMapping("/api/leases")
public class LeaseController {
    private final LeaseService leaseService;
    private final PropertyRepository propertyRepository;

    public LeaseController(LeaseService leaseService, PropertyRepository propertyRepository){
        this.leaseService = leaseService;
        this.propertyRepository = propertyRepository;
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
    public ResponseEntity<List<LeaseDTO>> all(){ return ResponseEntity.ok(leaseService.findAllDTO()); }
}
