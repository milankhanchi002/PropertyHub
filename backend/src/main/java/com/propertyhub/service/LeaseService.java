package com.propertyhub.service;

import com.propertyhub.model.Lease;
import com.propertyhub.repository.LeaseRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.propertyhub.dto.LeaseDTO;

@Service
public class LeaseService {
    private final LeaseRepository leaseRepository;
    public LeaseService(LeaseRepository leaseRepository){this.leaseRepository = leaseRepository;}
    public Lease save(Lease l){return leaseRepository.save(l);}
    public List<Lease> findAll(){return leaseRepository.findAll();}
    public Optional<Lease> findById(Long id){return leaseRepository.findById(id);} 

    private LeaseDTO toDTO(Lease l) {
        return new LeaseDTO(
                l.getId(),
                l.getProperty() != null ? l.getProperty().getId() : null,
                l.getProperty() != null ? l.getProperty().getTitle() : null,
                l.getTenantName(),
                l.getTenantEmail(),
                l.getStartDate(),
                l.getEndDate(),
                l.getMonthlyRent(),
                l.getStatus()
        );
    }

    public List<LeaseDTO> findAllDTO() {
        return leaseRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }
    public LeaseDTO toDTOResponse(Lease saved) { return toDTO(saved); }

    public List<LeaseDTO> findByOwnerIdDTO(Long ownerId) {
        return leaseRepository.findByOwnerId(ownerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<LeaseDTO> findByTenantEmailDTO(String email) {
        return leaseRepository.findByTenantEmail(email).stream().map(this::toDTO).collect(Collectors.toList());
    }
}
