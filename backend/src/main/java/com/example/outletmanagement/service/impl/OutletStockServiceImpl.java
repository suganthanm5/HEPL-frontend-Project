package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.payload.dto.response.OutletStockResponse;
import com.example.outletmanagement.payload.dto.response.StockTransactionResponse;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.service.OutletStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OutletStockServiceImpl implements OutletStockService {
        private final OutletStockRepository outletStockRepository;
        private final StockTransactionRepository stockTransactionRepository;
        private final OutletRepository outletRepository;
        private final ProductRepository productRepository;
        private final ProductBatchRepository productBatchRepository;
        private final UserRepository userRepository;
        private final com.example.outletmanagement.service.AuditLogService auditLogService;

        private OutletStockResponse toOutletStockResponse(OutletStock stock) {
                return OutletStockResponse.builder()
                                .id(stock.getId())
                                .outletId(stock.getOutlet().getId())
                                .outletName(stock.getOutlet().getOutletName())
                                .productId(stock.getProduct().getId())
                                .productName(stock.getProduct().getName())
                                .batchId(stock.getBatch().getId())
                                .batchNo(stock.getBatch().getBatchNo())
                                .availableQty(stock.getAvailableQty())
                                .reservedQty(stock.getReservedQty())
                                .build();
        }

        private StockTransactionResponse toStockTransactionResponse(StockTransaction transaction) {
                return StockTransactionResponse.builder()
                                .id(transaction.getId())
                                .productId(transaction.getProduct().getId())
                                .productName(transaction.getProduct().getName())
                                .batchId(transaction.getBatch().getId())
                                .batchNo(transaction.getBatch().getBatchNo())
                                .outletId(transaction.getOutlet() != null ? transaction.getOutlet().getId() : null)
                                .outletName(transaction.getOutlet() != null ? transaction.getOutlet().getOutletName()
                                                : null)
                                .quantity(transaction.getQuantity())
                                .transactionType(transaction.getTransactionType().toString())
                                .referenceNo(transaction.getReferenceNo())
                                .remarks(transaction.getRemarks())
                                .createdBy(transaction.getUser().getUsername())
                                .createdAt(transaction.getCreatedAt())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public Page<OutletStockResponse> getStockByOutlet(Long outletId, Pageable pageable) {
                return outletStockRepository.findByOutletId(outletId, pageable)
                                .map(this::toOutletStockResponse);
        }

        @Override
        @Transactional(readOnly = true)
        public Page<OutletStockResponse> getAllStock(String search, Long outletId, Long productId, Pageable pageable) {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Current user not found"));

                Long activeOutletId = outletId;
                if (currentUser.getRole() != User.Role.ADMIN && currentUser.getRole() != User.Role.MANAGER) {
                        if (currentUser.getOutlet() == null) {
                                return Page.empty(pageable);
                        }
                        activeOutletId = currentUser.getOutlet().getId();
                } else if (currentUser.getRole() == User.Role.MANAGER && currentUser.getOutlet() != null) {
                        activeOutletId = currentUser.getOutlet().getId();
                }

                org.springframework.data.jpa.domain.Specification<OutletStock> spec = 
                                com.example.outletmanagement.specification.OutletStockSpecification.searchAndFilter(
                                                search, activeOutletId, productId);
                return outletStockRepository.findAll(spec, pageable)
                                .map(this::toOutletStockResponse);
        }

        @Override
        @Transactional
        public OutletStockResponse transferStock(Long fromOutletId, Long toOutletId, Long productId, Long batchId,
                        Integer quantity, String remarks) {
                Outlet fromOutlet = outletRepository.findById(fromOutletId)
                                .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", fromOutletId));
                Outlet toOutlet = outletRepository.findById(toOutletId)
                                .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", toOutletId));
                Product product = productRepository.findById(productId)
                                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
                ProductBatch batch = productBatchRepository.findById(batchId)
                                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", batchId));

                OutletStock fromStock = outletStockRepository
                                .findByOutletIdAndProductIdAndBatchId(fromOutletId, productId, batchId)
                                .orElseThrow(() -> new RuntimeException(
                                                "No stock found in source outlet for this product/batch"));

                if (fromStock.getAvailableQty() < quantity) {
                        throw new RuntimeException("Insufficient stock in source outlet. Available: "
                                        + fromStock.getAvailableQty() + ", Required: " + quantity);
                }

                // Deduct from source outlet
                fromStock.setAvailableQty(fromStock.getAvailableQty() - quantity);
                outletStockRepository.save(fromStock);

                // Add to destination outlet
                OutletStock toStock = outletStockRepository
                                .findByOutletIdAndProductIdAndBatchId(toOutletId, productId, batchId)
                                .orElse(OutletStock.builder()
                                                .outlet(toOutlet)
                                                .product(product)
                                                .batch(batch)
                                                .availableQty(0)
                                                .reservedQty(0)
                                                .build());
                toStock.setAvailableQty(toStock.getAvailableQty() + quantity);
                OutletStock savedToStock = outletStockRepository.save(toStock);

                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Current user not found"));

                // OUT from source outlet
                stockTransactionRepository.save(StockTransaction.builder()
                                .transactionType(StockTransaction.TransactionType.TRANSFER_OUT)
                                .product(product).batch(batch).outlet(fromOutlet)
                                .quantity(quantity).user(currentUser)
                                .remarks(remarks != null && !remarks.trim().isEmpty()
                                                ? remarks + " (Transfer to outlet: " + toOutlet.getOutletName() + ")"
                                                : "Transfer to outlet: " + toOutlet.getOutletName())
                                .build());

                // IN to destination outlet
                stockTransactionRepository.save(StockTransaction.builder()
                                .transactionType(StockTransaction.TransactionType.TRANSFER_IN)
                                .product(product).batch(batch).outlet(toOutlet)
                                .quantity(quantity).user(currentUser)
                                .remarks(remarks != null && !remarks.trim().isEmpty()
                                                ? remarks + " (Transfer from outlet: " + fromOutlet.getOutletName()
                                                                + ")"
                                                : "Transfer from outlet: " + fromOutlet.getOutletName())
                                .build());

                auditLogService.log("TRANSFER_STOCK", "Transferred " + quantity + " of product " + product.getName() + " (Batch: " + batch.getBatchNo() + ") from outlet " + fromOutlet.getOutletName() + " to outlet " + toOutlet.getOutletName());
                return toOutletStockResponse(savedToStock);
        }

        @Override
        @Transactional(readOnly = true)
        public Page<StockTransactionResponse> getTransactions(Long outletId, Long productId, Pageable pageable) {
                return stockTransactionRepository.findFilteredTransactions(outletId, productId, null, pageable)
                                .map(this::toStockTransactionResponse);
        }

        @Override
        @Transactional(readOnly = true)
        public Page<StockTransactionResponse> getFilteredTransactions(Long outletId, Long productId,
                        StockTransaction.TransactionType type, Pageable pageable) {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Current user not found"));

                Long effectiveOutletId = outletId;
                if (currentUser.getRole() != User.Role.ADMIN && currentUser.getRole() != User.Role.MANAGER) {
                        if (currentUser.getOutlet() == null) {
                                return Page.empty(pageable);
                        }
                        effectiveOutletId = currentUser.getOutlet().getId();
                } else if (currentUser.getRole() == User.Role.MANAGER && currentUser.getOutlet() != null) {
                        effectiveOutletId = currentUser.getOutlet().getId();
                }

                return stockTransactionRepository.findFilteredTransactions(effectiveOutletId, productId, type, pageable)
                                .map(this::toStockTransactionResponse);
        }

        @Override
        @Transactional(readOnly = true)
        public java.util.Map<String, Long> getTransactionStats(Long outletId, Long productId) {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Current user not found"));

                Long effectiveOutletId = outletId;
                if (currentUser.getRole() != User.Role.ADMIN && currentUser.getRole() != User.Role.MANAGER) {
                        if (currentUser.getOutlet() == null) {
                                return new java.util.HashMap<>();
                        }
                        effectiveOutletId = currentUser.getOutlet().getId();
                } else if (currentUser.getRole() == User.Role.MANAGER && currentUser.getOutlet() != null) {
                        effectiveOutletId = currentUser.getOutlet().getId();
                }

                List<Object[]> results = stockTransactionRepository.getTransactionStats(effectiveOutletId, productId);
                java.util.Map<String, Long> stats = new java.util.HashMap<>();
                stats.put("totalIn", 0L);
                stats.put("totalOut", 0L);

                for (Object[] row : results) {
                        StockTransaction.TransactionType type = (StockTransaction.TransactionType) row[0];
                        Long sum = ((Number) row[1]).longValue();

                        if (type == StockTransaction.TransactionType.IN || type == StockTransaction.TransactionType.TRANSFER_IN) {
                                stats.put("totalIn", stats.get("totalIn") + sum);
                        } else if (type == StockTransaction.TransactionType.OUT || type == StockTransaction.TransactionType.TRANSFER_OUT) {
                                stats.put("totalOut", stats.get("totalOut") + sum);
                        }
                }
                return stats;
        }
}
