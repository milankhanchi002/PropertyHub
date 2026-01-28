package com.propertyhub.service;

import com.propertyhub.dto.VisitDTO;
import com.propertyhub.model.Visit;
import com.propertyhub.repository.VisitRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
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
                v.getStatus(),
                v.getProposedDateTime(),
                v.getRescheduleStatus()
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

    public Optional<VisitDTO> requestReschedule(Long id, String proposedDateTime) {
        Optional<Visit> opt = visitRepository.findById(id);
        if (opt.isEmpty()) return Optional.empty();
        Visit v = opt.get();
        LocalDateTime proposed;
        try {
            proposed = LocalDateTime.parse(proposedDateTime);
        } catch (Exception e) {
            return Optional.empty();
        }
        v.setProposedDateTime(proposed);
        v.setRescheduleStatus("REQUESTED");
        Visit saved = visitRepository.save(v);
        return Optional.of(toDTO(saved));
    }

    public Optional<VisitDTO> decideReschedule(Long id, String decision) {
        Optional<Visit> opt = visitRepository.findById(id);
        if (opt.isEmpty()) return Optional.empty();
        Visit v = opt.get();
        String d = decision == null ? "" : decision.toUpperCase();
        if ("ACCEPTED".equals(d)) {
            if (v.getProposedDateTime() == null) return Optional.empty();
            v.setVisitDateTime(v.getProposedDateTime());
            v.setProposedDateTime(null);
            v.setRescheduleStatus("ACCEPTED");
        } else if ("DECLINED".equals(d)) {
            v.setRescheduleStatus("DECLINED");
            // keep original time; clear proposed
            v.setProposedDateTime(null);
        } else {
            return Optional.empty();
        }
        Visit saved = visitRepository.save(v);
        return Optional.of(toDTO(saved));
    }
}
