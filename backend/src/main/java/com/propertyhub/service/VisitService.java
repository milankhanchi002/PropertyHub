package com.propertyhub.service;

import com.propertyhub.dto.VisitDTO;
import com.propertyhub.model.Visit;
import com.propertyhub.repository.VisitRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VisitService {
    private final VisitRepository visitRepository;
    public VisitService(VisitRepository visitRepository){this.visitRepository = visitRepository;}
    public Visit save(Visit v){return visitRepository.save(v);}    
    public List<Visit> findAll(){return visitRepository.findAll();}
    public Optional<Visit> findById(Long id){return visitRepository.findById(id);} 

    private VisitDTO toDTO(Visit v) {
        return new VisitDTO(
                v.getId(),
                v.getProperty() != null ? v.getProperty().getId() : null,
                v.getProperty() != null ? v.getProperty().getTitle() : null,
                v.getTenantName(),
                v.getTenantEmail(),
                v.getVisitDateTime(),
                v.getStatus()
        );
    }

    public List<VisitDTO> findAllDTO() {
        return visitRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<VisitDTO> findDTOByOwnerId(Long ownerId) {
        return visitRepository.findByOwnerId(ownerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<VisitDTO> findDTOByTenantEmail(String tenantEmail) {
        return visitRepository.findByTenantEmail(tenantEmail).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<VisitDTO> updateStatus(Long id, String status) {
        Optional<Visit> opt = visitRepository.findById(id);
        if (opt.isEmpty()) return Optional.empty();
        Visit v = opt.get();
        v.setStatus(status);
        Visit saved = visitRepository.save(v);
        return Optional.of(toDTO(saved));
    }
}
