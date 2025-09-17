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

    private PropertyDTO toDTO(Property p) {
        return new PropertyDTO(
                p.getId(),
                p.getTitle(),
                p.getDescription(),
                p.getAddress(),
                p.getCity(),
                p.isAvailable(),
                p.getPrice().doubleValue(),
                p.getType().name(),
                p.getOwner() != null ? p.getOwner().getName() : null,
                p.getOwner() != null ? p.getOwner().getEmail() : null
        );
    }

    // Get properties by city as DTOs
    public List<PropertyDTO> getPropertiesByCity(String city) {
        System.out.println("Received city in service: '" + city + "'");
        List<Property> properties;
        if (city != null && !city.trim().isEmpty()) {
            city = city.trim();
            properties = propertyRepository.findByCityWithOwner(city);
        } else {
            // If no city specified, return all properties
            properties = propertyRepository.findAll();
        }
        System.out.println("Found properties: " + properties.size());

        // --- THIS IS THE CORRECTED PART ---
        // The constructor now includes p.getAddress() and converts price/type to the correct format.
        return properties.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Search properties with filters (BigDecimal properly compared)
    public List<Property> search(String city, PropertyType type, BigDecimal min, BigDecimal max) {
        return propertyRepository.findAll().stream()
                .filter(p -> (city == null || p.getCity().equalsIgnoreCase(city)))
                .filter(p -> (type == null || p.getType().equals(type))) // Simplified enum comparison
                .filter(p -> (min == null || p.getPrice().compareTo(min) >= 0))
                .filter(p -> (max == null || p.getPrice().compareTo(max) <= 0))
                .collect(Collectors.toList());
    }

    // Search properties with filters and return as DTOs
    public List<PropertyDTO> searchAsDTO(String city, PropertyType type, BigDecimal min, BigDecimal max) {
        List<Property> properties = search(city, type, min, max);
        return properties.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<PropertyDTO> findDTOById(Long id) {
        return propertyRepository.findById(id).map(this::toDTO);
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