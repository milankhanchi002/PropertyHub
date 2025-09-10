package com.propertyhub.service;

import com.propertyhub.dto.PropertyDTO;
import com.propertyhub.model.Property;
import com.propertyhub.model.PropertyType;
import com.propertyhub.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    // Get properties by city as DTOs
    public List<PropertyDTO> getPropertiesByCity(String city) {
        System.out.println("Received city in service: '" + city + "'");  // Debug log
        if (city != null) {
            city = city.trim();
        }  // Important: Remove leading/trailing spaces
        List<Property> properties = propertyRepository.findByCityWithOwner(city);
        System.out.println("Found properties: " + properties.size());  // Debug log


        return properties.stream().map(p -> new PropertyDTO(
                p.getId(),
                p.getTitle(),
                p.getDescription(),
                p.getCity(),
                p.isAvailable(),
                p.getPrice(),
                p.getType(),
                p.getOwner() != null ? p.getOwner().getName() : null,
                p.getOwner() != null ? p.getOwner().getEmail() : null
        )).collect(Collectors.toList());
    }

    // Search properties with filters (BigDecimal properly compared)
    public List<Property> search(String city, PropertyType type, BigDecimal min, BigDecimal max) {
        return propertyRepository.findAll().stream()
                .filter(p -> (city == null || p.getCity().equalsIgnoreCase(city)))
                .filter(p -> (type == null || p.getType().equals(type.name())))
                .filter(p -> (min == null || p.getPrice().compareTo(min) >= 0))
                .filter(p -> (max == null || p.getPrice().compareTo(max) <= 0))
                .collect(Collectors.toList());
    }

    public Optional<Property> findById(Long id) {
        return propertyRepository.findById(id);
    }

    public Property save(Property property) {
        return propertyRepository.save(property);
    }

    public void deleteById(Long id) {
        propertyRepository.deleteById(id);
    }
}
