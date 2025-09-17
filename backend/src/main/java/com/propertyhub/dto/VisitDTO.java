package com.propertyhub.dto;

import java.time.LocalDateTime;

public class VisitDTO {
    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private String tenantName;
    private String tenantEmail;
    private LocalDateTime visitDateTime;
    private String status;

    public VisitDTO() {}

    public VisitDTO(Long id, Long propertyId, String propertyTitle, String tenantName, String tenantEmail, LocalDateTime visitDateTime, String status) {
        this.id = id;
        this.propertyId = propertyId;
        this.propertyTitle = propertyTitle;
        this.tenantName = tenantName;
        this.tenantEmail = tenantEmail;
        this.visitDateTime = visitDateTime;
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

    public LocalDateTime getVisitDateTime() { return visitDateTime; }
    public void setVisitDateTime(LocalDateTime visitDateTime) { this.visitDateTime = visitDateTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
