package com.propertyhub.repository;

import com.propertyhub.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitRepository extends JpaRepository<Visit, Long> {
    @Query("select v from Visit v where v.property.owner.id = :ownerId")
    java.util.List<Visit> findByOwnerId(@Param("ownerId") Long ownerId);

    java.util.List<Visit> findByTenantEmail(String tenantEmail);

    // Remove all visits linked to a property to avoid FK constraint on delete
    void deleteByProperty_Id(Long propertyId);
}
