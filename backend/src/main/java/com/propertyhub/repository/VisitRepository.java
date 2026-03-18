package com.propertyhub.repository;

import com.propertyhub.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitRepository extends JpaRepository<Visit, Long> {
    @Query("select v from Visit v where v.property.owner.id = :ownerId order by v.createdAt desc")
    java.util.List<Visit> findByOwnerId(@Param("ownerId") Long ownerId);

    @Query("select v from Visit v where v.tenantEmail = :tenantEmail order by v.createdAt desc")
    java.util.List<Visit> findByTenantEmail(@Param("tenantEmail") String tenantEmail);

    @Query("select v from Visit v order by v.createdAt desc")
    java.util.List<Visit> findAllByOrderByCreatedAtDesc();

    // Remove all visits linked to a property to avoid FK constraint on delete
    void deleteByProperty_Id(Long propertyId);
}
