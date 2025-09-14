package com.propertyhub.dto;

import com.propertyhub.model.PropertyType;

import java.math.BigDecimal;

public class PropertyDTO {
    private Long id;
    private String title;
    private String description;
    private String address; // <-- FIELD ADDED HERE
    private String city;
    private boolean available;
    private double price;
    private String type;
    private String ownerName;
    private String ownerEmail;

    // Constructors
    public PropertyDTO() {}

    public PropertyDTO(Long id, String title, String description, String address, String city, boolean available,
                       double price, String type, String ownerName, String ownerEmail) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.address = address; // <-- ADDED TO CONSTRUCTOR
        this.city = city;
        this.available = available;
        this.price = price;
        this.type = type;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    // --- GETTER AND SETTER FOR ADDRESS ---
    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
    // ------------------------------------

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }
}