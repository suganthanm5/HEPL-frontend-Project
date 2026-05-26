package com.example.outletmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Column(name = "batch_number", nullable = false)
    private Integer batchNumber;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @PrePersist
    public void prePersist() {
        if (this.request != null && this.requestId == null) {
            this.requestId = this.request.getId();
        }
    }
}
