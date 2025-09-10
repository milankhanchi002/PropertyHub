package com.propertyhub.service;

import com.propertyhub.model.Visit;
import com.propertyhub.repository.VisitRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class VisitService {
    private final VisitRepository visitRepository;
    public VisitService(VisitRepository visitRepository){this.visitRepository = visitRepository;}
    public Visit save(Visit v){return visitRepository.save(v);}
    public List<Visit> findAll(){return visitRepository.findAll();}
    public Optional<Visit> findById(Long id){return visitRepository.findById(id);}
}
