package com.propertyhub.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class LeaseDTO {
    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private String tenantName;
    private String tenantEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal monthlyRent;
    private String status;

    public LeaseDTO() {}

    public LeaseDTO(Long id, Long propertyId, String propertyTitle, String tenantName, String tenantEmail,
                    LocalDate startDate, LocalDate endDate, BigDecimal monthlyRent, String status) {
        this.id = id;
        this.propertyId = propertyId;
        this.propertyTitle = propertyTitle;
        this.tenantName = tenantName;
        this.tenantEmail = tenantEmail;
        this.startDate = startDate;
        this.endDate = endDate;
        this.monthlyRent = monthlyRent;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPropertyId() { return propertyId; }
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }
    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }
    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }
    public String getTenantEmail() { return tenantEmail; }
    public void setTenantEmail(String tenantEmail) { this.tenantEmail = tenantEmail; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getMonthlyRent() { return monthlyRent; }
    public void setMonthlyRent(BigDecimal monthlyRent) { this.monthlyRent = monthlyRent; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
