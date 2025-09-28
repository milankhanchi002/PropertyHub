package com.propertyhub.repository;

import com.propertyhub.model.Lease;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaseRepository extends JpaRepository<Lease, Long> {
    // Remove all leases linked to a property to avoid FK constraint on delete
    void deleteByProperty_Id(Long propertyId);
}
