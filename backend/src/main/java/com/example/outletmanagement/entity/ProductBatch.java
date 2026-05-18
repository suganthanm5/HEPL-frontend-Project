package com.example.outletmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "product_batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@SQLDelete(sql = "UPDATE product_batches SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class ProductBatch extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = true)
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Product product;

    @Column(nullable = false)
    private String batchNo;

    private LocalDate manufactureDate;
    private LocalDate expiryDate;

    @Column(nullable = false)
    private Integer quantity;

    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;

    @Column(name = "minimum_threshold", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer minimumThreshold = 0;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        ACTIVE, INACTIVE, EXPIRED
    }
}
