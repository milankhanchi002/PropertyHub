package com.propertyhub.service;

import com.propertyhub.model.Lease;
import com.propertyhub.repository.LeaseRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class LeaseService {
    private final LeaseRepository leaseRepository;
    public LeaseService(LeaseRepository leaseRepository){this.leaseRepository = leaseRepository;}
    public Lease save(Lease l){return leaseRepository.save(l);}
    public List<Lease> findAll(){return leaseRepository.findAll();}
    public Optional<Lease> findById(Long id){return leaseRepository.findById(id);}
}
