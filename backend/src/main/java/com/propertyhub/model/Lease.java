package com.propertyhub.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
public class Lease {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Property property;

    private String tenantName;
    private String tenantEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal monthlyRent;
    private String status;

    public Lease(){}

    public Long getId(){return id;}
    public void setId(Long id){this.id=id;}
    public Property getProperty(){return property;}
    public void setProperty(Property property){this.property=property;}
    public String getTenantName(){return tenantName;}
    public void setTenantName(String tenantName){this.tenantName=tenantName;}
    public String getTenantEmail(){return tenantEmail;}
    public void setTenantEmail(String tenantEmail){this.tenantEmail=tenantEmail;}
    public LocalDate getStartDate(){return startDate;}
    public void setStartDate(LocalDate startDate){this.startDate=startDate;}
    public LocalDate getEndDate(){return endDate;}
    public void setEndDate(LocalDate endDate){this.endDate=endDate;}
    public BigDecimal getMonthlyRent(){return monthlyRent;}
    public void setMonthlyRent(BigDecimal monthlyRent){this.monthlyRent=monthlyRent;}
    public String getStatus(){return status;}
    public void setStatus(String status){this.status=status;}
}
