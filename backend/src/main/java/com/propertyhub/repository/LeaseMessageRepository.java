package com.propertyhub.repository;

import com.propertyhub.model.LeaseMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface LeaseMessageRepository extends JpaRepository<LeaseMessage, Long> {
    @Query("select m from LeaseMessage m where m.lease.id = :leaseId order by m.createdAt asc")
    List<LeaseMessage> findByLeaseIdOrderByCreatedAtAsc(@Param("leaseId") Long leaseId);
}
