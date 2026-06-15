package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.entity.RequestBatch;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.repository.RequestBatchRepository;
import com.example.outletmanagement.service.OrderService;
import com.example.outletmanagement.websocket.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final OutletStockRepository outletStockRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final OutletRepository outletRepository;
    private final OutletDivisionProductRepository mappingRepository;
    private final OrderItemRepository orderItemRepository;
    private final RequestBatchRepository requestBatchRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final com.example.outletmanagement.service.AuditLogService auditLogService;
    private final com.example.outletmanagement.service.EmailService emailService;

    @Override
    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    @Override
    public Page<Order> getFilteredOrders(Order.OrderStatus status, Long outletId, String orderNo, Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (currentUser.getRole() == User.Role.USER) {
            return orderRepository.findFilteredOrders(status, outletId, orderNo, currentUser.getId(), pageable);
        } else if ((currentUser.getRole() == User.Role.OUTLET_MANAGER || currentUser.getRole() == User.Role.MANAGER) && currentUser.getOutlet() != null) {
            return orderRepository.findFilteredOrders(status, currentUser.getOutlet().getId(), orderNo, null, pageable);
        }
        return orderRepository.findFilteredOrders(status, outletId, orderNo, null, pageable); // ADMIN
    }

    @Override
    public List<Order> getOrdersByOutlet(Long outletId) {
        return orderRepository.findByOutletId(outletId);
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
    }

    @Override
    @Transactional
    public Order createOrder(com.example.outletmanagement.payload.dto.request.OrderRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (currentUser.getRole() == User.Role.USER || currentUser.getRole() == User.Role.OUTLET_MANAGER || currentUser.getRole() == User.Role.MANAGER) {
            if (request.getOutletId() == null) {
                if (currentUser.getOutlet() == null)
                    throw new RuntimeException("User must be assigned to an outlet first");
                request.setOutletId(currentUser.getOutlet().getId()); // fallback to their outlet
            }
        }

        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", request.getOutletId()));

        // Validate that products are mapped to the outlet
        for (var itemRequest : request.getItems()) {
            if (!mappingRepository.existsByOutletIdAndProductId(request.getOutletId(), itemRequest.getProductId())) {
                Product product = productRepository.findById(itemRequest.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));
                throw new RuntimeException(
                        "Product '" + product.getName() + "' is not mapped to outlet '" + outlet.getOutletName() + "'");
            }
        }

        Order order = Order.builder()
                .orderNo("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .outlet(outlet)
                .user(currentUser)
                .status(Order.OrderStatus.PENDING)
                .requestDate(java.time.LocalDateTime.now())
                .remarks(request.getRemarks())
                .build();

        List<OrderItem> items = request.getItems().stream().map(itemRequest -> {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            ProductBatch batch = null;
            BigDecimal price = product.getSellingPrice();

            // If batch is specified, fetch it and use its selling price
            if (itemRequest.getBatchId() != null) {
                batch = productBatchRepository.findById(itemRequest.getBatchId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException("ProductBatch", "id", itemRequest.getBatchId()));
                price = batch.getSellingPrice() != null ? batch.getSellingPrice() : price;
            }

            return OrderItem.builder()
                    .order(order)
                    .product(product)
                    .batch(batch)
                    .quantity(itemRequest.getQuantity())
                    .price(price)
                    .remarks(itemRequest.getRemarks())
                    .build();
        }).toList();

        order.setItems(items);
        Order saved = orderRepository.save(order);
        auditLogService.log("CREATE_ORDER", "Created order " + saved.getOrderNo() + " for outlet " + outlet.getOutletName() + " (ID: " + saved.getId() + ")");

        // Publish real-time event ONLY after transaction commits to prevent frontend race conditions
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
            @Override
            public void afterCommit() {
                webSocketEventPublisher.publishNewOrder(
                        saved.getId(),
                        saved.getOrderNo(),
                        outlet.getId(),
                        outlet.getOutletName(),
                        saved.getStatus().name()
                );
            }
        });

        // Send email notification via Mailtrap
        emailService.sendOrderNotification(saved);

        return saved;
    }

    @Override
    @Transactional
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = getOrderById(id);
        if (order.getStatus() == status)
            return order;

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        // Only allocate stock and generate batch if transitioning to APPROVED
        if (status == Order.OrderStatus.APPROVED && (order.getStatus() == Order.OrderStatus.PENDING || order.getStatus() == Order.OrderStatus.PARTIALLY_APPROVED)) {
            // Generate outlet-specific batch number if not already set
            if (order.getBatchNumber() == null) {
                Integer maxBatch = orderRepository.findMaxBatchNumberByOutletId(order.getOutlet().getId());
                Integer nextBatch = (maxBatch == null || maxBatch == 0) ? 1 : maxBatch + 1;
                order.setBatchNumber(nextBatch);
                order.setApprovedBy(currentUser.getName());
                order.setApprovedDate(java.time.LocalDateTime.now());
                
                // Create request batch record
                RequestBatch requestBatch = RequestBatch.builder()
                        .request(order)
                        .outlet(order.getOutlet())
                        .batchNumber(nextBatch)
                        .approvedBy(currentUser.getName())
                        .approvedAt(java.time.LocalDateTime.now())
                        .build();
                requestBatchRepository.save(requestBatch);
            }

            // Deduct stock (FIFO) with partial allocation support
            boolean allFullyAllocated = allocateStockFIFO(order, currentUser);
            
            if (allFullyAllocated) {
                order.setStatus(Order.OrderStatus.APPROVED);
            } else {
                order.setStatus(Order.OrderStatus.PARTIALLY_APPROVED);
            }
        } else {
            // For other statuses like COMPLETED, REJECTED, CANCELLED
            order.setStatus(status);
        }

        Order updated = orderRepository.save(order);
        auditLogService.log("UPDATE_ORDER_STATUS", "Updated order " + updated.getOrderNo() + " status to " + status.name());

        // Publish real-time status change event ONLY after transaction commits
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
            @Override
            public void afterCommit() {
                webSocketEventPublisher.publishOrderStatusChange(
                        updated.getId(),
                        updated.getOrderNo(),
                        updated.getOutlet().getId(),
                        updated.getOutlet().getOutletName(),
                        updated.getStatus().name()
                );
            }
        });

        if (updated.getStatus() == Order.OrderStatus.APPROVED || updated.getStatus() == Order.OrderStatus.PARTIALLY_APPROVED) {
            emailService.sendOrderApprovedNotification(updated);
        }

        return updated;
    }

    private boolean allocateStockFIFO(Order order, User currentUser) {
        boolean allFullyAllocated = true;

        for (OrderItem item : order.getItems()) {
            int remainingToAllocate = item.getQuantity() - (item.getFulfilledQuantity() != null ? item.getFulfilledQuantity() : 0);
            if (remainingToAllocate <= 0) continue;

            // FIFO: Oldest expiry first
            List<ProductBatch> batches = productBatchRepository
                    .findByProductIdAndStatusAndQuantityGreaterThanOrderByExpiryDateAsc(
                            item.getProduct().getId(), ProductBatch.Status.ACTIVE, 0);

            int totalAvailable = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
            
            int toAllocateNow = Math.min(remainingToAllocate, totalAvailable);
            
            if (toAllocateNow < remainingToAllocate) {
                allFullyAllocated = false;
            }

            if (toAllocateNow <= 0) continue;

            int allocatedThisTime = 0;

            for (ProductBatch batch : batches) {
                if (toAllocateNow <= 0) break;

                int allocationFromThisBatch = Math.min(batch.getQuantity(), toAllocateNow);

                batch.setQuantity(batch.getQuantity() - allocationFromThisBatch);
                productBatchRepository.save(batch);

                OutletStock outletStock = outletStockRepository
                        .findByOutletIdAndProductIdAndBatchId(order.getOutlet().getId(), item.getProduct().getId(),
                                batch.getId())
                        .orElse(OutletStock.builder()
                                .outlet(order.getOutlet())
                                .product(item.getProduct())
                                .batch(batch)
                                .availableQty(0)
                                .reservedQty(0)
                                .build());

                outletStock.setAvailableQty(outletStock.getAvailableQty() + allocationFromThisBatch);
                outletStockRepository.save(outletStock);

                // SET batch on the OrderItem so COMPLETE step can find it
                if (item.getBatch() == null) {
                    item.setBatch(batch);
                }

                // Log Transactions
                // 1. OUT from Warehouse
                stockTransactionRepository.save(StockTransaction.builder()
                        .transactionType(StockTransaction.TransactionType.OUT)
                        .product(item.getProduct())
                        .batch(batch)
                        .outlet(null) // Warehouse
                        .user(currentUser)
                        .quantity(allocationFromThisBatch)
                        .referenceNo(order.getOrderNo())
                        .remarks("FIFO Allocation for Order: " + order.getOrderNo())
                        .build());

                // 2. IN to Outlet
                stockTransactionRepository.save(StockTransaction.builder()
                        .transactionType(StockTransaction.TransactionType.IN)
                        .product(item.getProduct())
                        .batch(batch)
                        .outlet(order.getOutlet())
                        .user(currentUser)
                        .quantity(allocationFromThisBatch)
                        .referenceNo(order.getOrderNo())
                        .remarks("Stock Receipt from Order: " + order.getOrderNo())
                        .build());

                toAllocateNow -= allocationFromThisBatch;
                allocatedThisTime += allocationFromThisBatch;
            }

            item.setFulfilledQuantity((item.getFulfilledQuantity() != null ? item.getFulfilledQuantity() : 0) + allocatedThisTime);
            orderItemRepository.save(item);
        }

        return allFullyAllocated;
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Cannot delete order that is not in PENDING status");
        }
        orderRepository.deleteById(id); // triggers @SQLDelete soft-delete
        auditLogService.log("DELETE_ORDER", "Deleted order ID: " + id + " (Order No: " + order.getOrderNo() + ")");
    }

    @Override
    public java.util.Map<String, Long> getOrderCounts(Long outletId) {
        List<Object[]> results = orderRepository.getOrderCountsByStatus(outletId);
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        // Initialize all statuses to 0
        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            counts.put(status.name(), 0L);
        }
        for (Object[] row : results) {
            Order.OrderStatus status = (Order.OrderStatus) row[0];
            Long count = ((Number) row[1]).longValue();
            counts.put(status.name(), count);
        }
        return counts;
    }
}
