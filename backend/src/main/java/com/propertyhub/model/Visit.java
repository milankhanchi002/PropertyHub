package com.propertyhub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Visit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Property property;

    private String tenantName;
    private String tenantEmail;
    private LocalDateTime visitDateTime;
    private String status;

    public Visit(){}

    public Long getId(){return id;}
    public void setId(Long id){this.id=id;}
    public Property getProperty(){return property;}
    public void setProperty(Property property){this.property=property;}
    public String getTenantName(){return tenantName;}
    public void setTenantName(String tenantName){this.tenantName=tenantName;}
    public String getTenantEmail(){return tenantEmail;}
    public void setTenantEmail(String tenantEmail){this.tenantEmail=tenantEmail;}
    public LocalDateTime getVisitDateTime(){return visitDateTime;}
    public void setVisitDateTime(LocalDateTime visitDateTime){this.visitDateTime=visitDateTime;}
    public String getStatus(){return status;}
    public void setStatus(String status){this.status=status;}
}
