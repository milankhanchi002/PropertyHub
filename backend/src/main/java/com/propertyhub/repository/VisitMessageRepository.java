package com.propertyhub.repository;

import com.propertyhub.model.VisitMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface VisitMessageRepository extends JpaRepository<VisitMessage, Long> {
    @Query("select m from VisitMessage m where m.visit.id = :visitId order by m.createdAt asc")
    List<VisitMessage> findByVisitIdOrderByCreatedAtAsc(@Param("visitId") Long visitId);
}
