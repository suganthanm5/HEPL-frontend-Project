package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.service.OrderService;
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
        } else if (currentUser.getRole() == User.Role.MANAGER && currentUser.getOutlet() != null) {
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

        if (currentUser.getRole() == User.Role.USER || currentUser.getRole() == User.Role.MANAGER) {
            if (currentUser.getOutlet() == null)
                throw new RuntimeException("User must be assigned to an outlet first");
            request.setOutletId(currentUser.getOutlet().getId()); // force their outlet
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
                    .build();
        }).toList();

        order.setItems(items);
        return orderRepository.save(order);
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

        if (status == Order.OrderStatus.APPROVED && order.getStatus() == Order.OrderStatus.PENDING) {
            allocateStockFIFO(order, currentUser);
            status = Order.OrderStatus.COMPLETED; // Auto-transition to COMPLETED
        }

        order.setStatus(status);
        return orderRepository.save(order);
    }

    private void allocateStockFIFO(Order order, User currentUser) {
        for (OrderItem item : order.getItems()) {
            int remainingToAllocate = item.getQuantity();

            // FIFO: Oldest expiry first
            List<ProductBatch> batches = productBatchRepository
                    .findByProductIdAndStatusAndQuantityGreaterThanOrderByExpiryDateAsc(
                            item.getProduct().getId(), ProductBatch.Status.ACTIVE, 0);

            int totalAvailable = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
            if (totalAvailable < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + item.getProduct().getName()
                        + ". Available: " + totalAvailable + ", Required: " + item.getQuantity());
            }

            for (ProductBatch batch : batches) {
                if (remainingToAllocate <= 0)
                    break;

                int allocationFromThisBatch = Math.min(batch.getQuantity(), remainingToAllocate);

                // Update Batch Stock
                batch.setQuantity(batch.getQuantity() - allocationFromThisBatch);
                productBatchRepository.save(batch);

                // Update Outlet Stock
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
                    orderItemRepository.save(item);
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

                remainingToAllocate -= allocationFromThisBatch;
            }
        }
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Cannot delete order that is not in PENDING status");
        }
        orderRepository.deleteById(id); // triggers @SQLDelete soft-delete
    }
}
