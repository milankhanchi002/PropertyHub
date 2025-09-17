package com.propertyhub.repository;

import com.propertyhub.model.Property;
import com.propertyhub.model.PropertyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    @Query("SELECT p FROM Property p JOIN FETCH p.owner WHERE UPPER(p.city) = UPPER(:city)")
    List<Property> findByCityWithOwner(@Param("city") String city);
    // Finds properties by city, ignoring case.
    List<Property> findByCityContainingIgnoreCase(String city);
    List<Property> findByCityIgnoreCase(String city);
    // Finds properties by type.
    List<Property> findByType(PropertyType type);

    // Finds properties with a price within a specified range.
    List<Property> findByPriceBetween(BigDecimal min, BigDecimal max);
}
