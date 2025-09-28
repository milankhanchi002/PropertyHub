package com.propertyhub.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "properties")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Property {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(length = 2000)
    private String description;
    private String address;
    private String city;
    private BigDecimal price;
    @Enumerated(EnumType.STRING)
    private PropertyType type;
    private boolean available = true;

    @ElementCollection
    @CollectionTable(name = "property_images", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "image_url")
    private List<String> imageUrls;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    private User owner;

    public Property(){}

    public Long getId(){return id;}
    public void setId(Long id){this.id=id;}
    public String getTitle(){return title;}
    public void setTitle(String title){this.title=title;}
    public String getDescription(){return description;}
    public void setDescription(String description){this.description=description;}
    public String getAddress(){return address;}
    public void setAddress(String address){this.address=address;}
    public String getCity(){return city;}
    public void setCity(String city){this.city=city;}
    public BigDecimal getPrice(){return price;}
    public void setPrice(BigDecimal price){this.price=price;}
    public PropertyType getType(){return type;}
    public void setType(PropertyType type){this.type=type;}
    public boolean isAvailable(){return available;}
    public void setAvailable(boolean available){this.available=available;}
    public User getOwner(){return owner;}
    public void setOwner(User owner){this.owner=owner;}
    public List<String> getImageUrls() {return imageUrls;}
    public void setImageUrls(List<String> imageUrls) {this.imageUrls = imageUrls;}
}
