package com.propertyhub.repository;

import com.propertyhub.model.Lease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeaseRepository extends JpaRepository<Lease, Long> {
    // Remove all leases linked to a property to avoid FK constraint on delete
    void deleteByProperty_Id(Long propertyId);

    @Query("select l from Lease l where l.property.owner.id = :ownerId")
    java.util.List<Lease> findByOwnerId(@Param("ownerId") Long ownerId);

    java.util.List<Lease> findByTenantEmail(String tenantEmail);
}
