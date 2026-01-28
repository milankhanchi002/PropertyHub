package com.propertyhub.model;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime visitDateTime;
    private String status;

    // Reschedule support
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime proposedDateTime; // new time proposed by owner
    private String rescheduleStatus; // NONE|REQUESTED|ACCEPTED|DECLINED
    private String requestedBy; // OWNER or TENANT (future use)

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

    public LocalDateTime getProposedDateTime() {return proposedDateTime;}
    public void setProposedDateTime(LocalDateTime proposedDateTime) {this.proposedDateTime = proposedDateTime;}

    public String getRescheduleStatus() {return rescheduleStatus;}
    public void setRescheduleStatus(String rescheduleStatus) {this.rescheduleStatus = rescheduleStatus;}

    public String getRequestedBy() {return requestedBy;}
    public void setRequestedBy(String requestedBy) {this.requestedBy = requestedBy;}
}
