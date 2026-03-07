package com.tokenapp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "shares")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Share {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Share name cannot be blank")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Share description cannot be blank")
    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Total tokens cannot be null")
    @Column(nullable = false)
    private Long totalTokens;

    @NotNull(message = "Current value cannot be null")
    @Column(nullable = false)
    private BigDecimal currentValue;

    @Column(name = "previous_value")
    private BigDecimal previousValue;

    @Column(name = "price_change")
    private BigDecimal priceChange;

    @Column(name = "price_change_percentage")
    private BigDecimal priceChangePercentage;

    @Column(name = "local_news_score")
    private Double localNewsScore;

    @Column(name = "recent_momentum_score")
    private Double recentMomentumScore;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "neighborhood")
    private String neighborhood;

    @Column(name = "estimated_avg_home_price")
    private BigDecimal estimatedAvgHomePrice;

    @Column(name = "price_action")
    private String priceAction;

    @Column(name = "last_price_update")
    private LocalDateTime lastPriceUpdate;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "share", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<UserToken> userTokens = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

