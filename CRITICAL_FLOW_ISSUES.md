# CRITICAL FLOW ISSUES - Outlet Management System

## 🚨 MAJOR ISSUES FOUND

### 1. **CRITICAL: Order Creation Stock Validation is WRONG**
**Location:** `OrderServiceImpl.java` - `createOrder()` method (lines 56-68)

**Problem:**
```java
// Current code validates outlet_stock BEFORE order creation
int totalAvailable = outletStockRepository.findByOutletIdAndProductIdAndBatchId(
    request.getOutletId(), itemRequest.getProductId(), itemRequest.getBatchId())
    .map(OutletStock::getAvailableQty)
    .orElse(0);
```

**Why This is WRONG:**
According to your requirements:
- **"Stock is NOT validated at order creation time. Validation happens at APPROVE time."**
- Orders should be created with status PENDING without any stock checks
- Stock validation and allocation should ONLY happen when order status changes to APPROVED

**Impact:** 
- Users cannot create orders for products not yet in outlet stock
- Violates the entire order lifecycle design
- Prevents warehouse-to-outlet ordering workflow

**Fix Required:**
```java
@Override
@Transactional
public Order createOrder(OrderRequest request) {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));

    Outlet outlet = outletRepository.findById(request.getOutletId())
            .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", request.getOutletId()));

    // NO STOCK VALIDATION HERE - only at APPROVE time

    Order order = Order.builder()
            .orderNo("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .outlet(outlet)
            .user(currentUser)
            .status(Order.OrderStatus.PENDING)
            .build();

    List<OrderItem> items = request.getItems().stream().map(itemRequest -> {
        Product product = productRepository.findById(itemRequest.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

        ProductBatch batch = productBatchRepository.findById(itemRequest.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", itemRequest.getBatchId()));

        return OrderItem.builder()
                .order(order)
                .product(product)
                .batch(batch)  // Store batch reference
                .quantity(itemRequest.getQuantity())
                .price(batch.getSellingPrice())
                .build();
    }).toList();

    order.setItems(items);
    return orderRepository.save(order);
}
```

---

### 2. **CRITICAL: Missing outlet_id Column in User Entity**
**Location:** `User.java` entity

**Problem:**
- User entity does NOT have `outlet_id` foreign key field
- Database schema requires: `users: id, name, username, email, password, role, outlet_id (FK to outlets), ...`
- MANAGER and USER roles MUST be assigned to an outlet
- Current implementation has no way to assign or track user's outlet

**Impact:**
- Cannot implement outlet-scoped access for MANAGER/USER roles
- Cannot filter orders/stock by user's assigned outlet
- Cannot auto-set outlet when USER/MANAGER creates orders
- Business rule #9 cannot be enforced

**Fix Required:**
```java
@Entity
@Table(name = "users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    private Role role;

    // ADD THIS:
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    // ... rest of fields
}
```

**Database Migration Required:**
```sql
ALTER TABLE users ADD COLUMN outlet_id BIGINT;
ALTER TABLE users ADD CONSTRAINT fk_users_outlet 
    FOREIGN KEY (outlet_id) REFERENCES outlets(id);
```

---

### 3. **CRITICAL: Order Item batch_id Should Be Optional**
**Location:** `OrderItem.java` entity (line 33)

**Problem:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "batch_id", nullable = false)  // ❌ Should be nullable
private ProductBatch batch;
```

**Why This is WRONG:**
According to requirements:
- **"Add items: select product, select batch (optional, FIFO if not selected)"**
- Users should be able to create orders WITHOUT selecting a specific batch
- FIFO allocation at APPROVE time should assign batches automatically

**Impact:**
- Forces users to select batch at order creation
- Prevents FIFO auto-allocation workflow
- Makes order creation unnecessarily complex

**Fix Required:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "batch_id", nullable = true)  // ✅ Make optional
private ProductBatch batch;
```

**Update OrderServiceImpl.createOrder():**
```java
List<OrderItem> items = request.getItems().stream().map(itemRequest -> {
    Product product = productRepository.findById(itemRequest.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

    ProductBatch batch = null;
    BigDecimal price;
    
    if (itemRequest.getBatchId() != null) {
        // User selected specific batch
        batch = productBatchRepository.findById(itemRequest.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", itemRequest.getBatchId()));
        price = batch.getSellingPrice();
    } else {
        // No batch selected - use product's default selling price
        price = product.getSellingPrice();
    }

    return OrderItem.builder()
            .order(order)
            .product(product)
            .batch(batch)  // Can be null
            .quantity(itemRequest.getQuantity())
            .price(price)
            .build();
}).toList();
```

**Update allocateStockFIFO():**
```java
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
            if (remainingToAllocate <= 0) break;

            int allocationFromThisBatch = Math.min(batch.getQuantity(), remainingToAllocate);

            // Update Batch Stock
            batch.setQuantity(batch.getQuantity() - allocationFromThisBatch);
            productBatchRepository.save(batch);

            // SET THE BATCH ON ORDER ITEM (if not already set)
            if (item.getBatch() == null) {
                item.setBatch(batch);
            }

            // Update Outlet Stock
            OutletStock outletStock = outletStockRepository
                    .findByOutletIdAndProductIdAndBatchId(order.getOutlet().getId(), 
                            item.getProduct().getId(), batch.getId())
                    .orElse(OutletStock.builder()
                            .outlet(order.getOutlet())
                            .product(item.getProduct())
                            .batch(batch)
                            .availableQty(0)
                            .reservedQty(0)
                            .build());

            outletStock.setAvailableQty(outletStock.getAvailableQty() + allocationFromThisBatch);
            outletStockRepository.save(outletStock);

            // Log Transactions (OUT from warehouse, IN to outlet)
            stockTransactionRepository.save(StockTransaction.builder()
                    .transactionType(StockTransaction.TransactionType.OUT)
                    .product(item.getProduct())
                    .batch(batch)
                    .outlet(null)
                    .user(currentUser)
                    .quantity(allocationFromThisBatch)
                    .referenceNo(order.getOrderNo())
                    .remarks("FIFO Allocation for Order: " + order.getOrderNo())
                    .build());

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
```

---

### 4. **MISSING: Outlet-Scoped Access Control**
**Location:** Multiple service implementations

**Problem:**
- MANAGER and USER roles should only see/access their assigned outlet's data
- Current implementation has NO outlet filtering
- All queries return system-wide data regardless of user's outlet assignment

**Impact:**
- MANAGER can see all outlets' data (should only see their outlet)
- USER can see all orders (should only see their own orders)
- Violates business rules #9

**Fix Required in OrderServiceImpl:**
```java
@Override
public List<Order> getFilteredOrders(Order.OrderStatus status, Long outletId, String orderNo) {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
    
    // Role-based filtering
    if (currentUser.getRole() == User.Role.USER) {
        // USER: only their own orders
        return orderRepository.findFilteredOrders(status, outletId, orderNo, currentUser.getId());
    } else if (currentUser.getRole() == User.Role.MANAGER) {
        // MANAGER: only their outlet's orders
        if (currentUser.getOutlet() == null) {
            throw new RuntimeException("Manager must be assigned to an outlet");
        }
        return orderRepository.findFilteredOrders(status, currentUser.getOutlet().getId(), orderNo, null);
    } else {
        // ADMIN: all orders
        return orderRepository.findFilteredOrders(status, outletId, orderNo, null);
    }
}
```

**Fix Required in OutletStockServiceImpl:**
```java
@Override
public List<OutletStock> getAllStock() {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
    
    // Role-based filtering
    if (currentUser.getRole() == User.Role.MANAGER || currentUser.getRole() == User.Role.USER) {
        if (currentUser.getOutlet() == null) {
            throw new RuntimeException("User must be assigned to an outlet");
        }
        return outletStockRepository.findByOutletId(currentUser.getOutlet().getId());
    } else {
        // ADMIN: all stock
        return outletStockRepository.findAll();
    }
}
```

---

### 5. **MISSING: Auto-Set Outlet for USER/MANAGER Orders**
**Location:** `OrderServiceImpl.createOrder()`

**Problem:**
- USER and MANAGER should have outlet auto-set to their assigned outlet
- Current code accepts any outlet from request
- Users could potentially create orders for outlets they don't belong to

**Fix Required:**
```java
@Override
@Transactional
public Order createOrder(OrderRequest request) {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));

    Long outletId = request.getOutletId();
    
    // Auto-set outlet for MANAGER/USER
    if (currentUser.getRole() == User.Role.MANAGER || currentUser.getRole() == User.Role.USER) {
        if (currentUser.getOutlet() == null) {
            throw new RuntimeException("User must be assigned to an outlet to create orders");
        }
        outletId = currentUser.getOutlet().getId();
    }

    Outlet outlet = outletRepository.findById(outletId)
            .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", outletId));

    // ... rest of order creation
}
```

---

### 6. **MISSING: Product Mapping Validation**
**Location:** `OrderServiceImpl.createOrder()`

**Problem:**
According to business rule #8:
- **"Only products mapped to an outlet via outlet_division_products can be ordered for that outlet"**
- No validation exists to check if product is mapped to outlet

**Fix Required:**
```java
@Override
@Transactional
public Order createOrder(OrderRequest request) {
    // ... existing code ...

    // Validate product mapping to outlet
    for (var itemRequest : request.getItems()) {
        boolean isMapped = outletDivisionProductRepository
                .existsByOutletIdAndProductId(outletId, itemRequest.getProductId());
        
        if (!isMapped) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));
            throw new RuntimeException("Product '" + product.getName() 
                    + "' is not mapped to this outlet. Please contact admin.");
        }
    }

    // ... rest of order creation
}
```

**Add to OutletDivisionProductRepository:**
```java
public interface OutletDivisionProductRepository extends JpaRepository<OutletDivisionProduct, Long> {
    boolean existsByOutletIdAndProductId(Long outletId, Long productId);
}
```

---

### 7. **MISSING: Dashboard Role-Based Data**
**Location:** `ReportController.java`

**Problem:**
- Dashboard shows same data for all roles
- Should show different metrics based on role:
  - ADMIN: system-wide stats
  - MANAGER: their outlet stats only
  - USER: their own orders only

**Fix Required:**
Create separate dashboard endpoints or filter data by role in existing endpoint.

---

### 8. **MISSING: Pagination Implementation**
**Location:** `OrderController.java`, `OutletStockController.java`

**Problem:**
- Requirements state: **"All list endpoints must support pagination using Pageable with default page=0 size=10"**
- Current order and stock endpoints return List instead of Page

**Fix Required:**
```java
@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
public ResponseEntity<ApiResponse> getAllOrders(
        @RequestParam(required = false) Order.OrderStatus status,
        @RequestParam(required = false) Long outletId,
        @RequestParam(required = false) String orderNo,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
) {
    Page<OrderResponse> response = orderService.getFilteredOrders(
            status, outletId, orderNo, PageRequest.of(page, size))
            .map(OrderResponse::from);
    return ResponseEntity.ok(ApiResponse.builder()
            .httpStatus(HttpStatus.OK.value())
            .message("Orders fetched successfully")
            .data(response)
            .build());
}
```

---

## 📋 SUMMARY OF REQUIRED FIXES

### Immediate Critical Fixes (Breaking Issues):
1. ✅ **Remove stock validation from createOrder()** - Orders should be created without stock checks
2. ❌ **Add outlet_id to User entity** - Requires database migration
3. ✅ **Make OrderItem.batch nullable** - Allow FIFO auto-allocation
4. ✅ **Add outlet-scoped filtering** - MANAGER/USER should only see their outlet data
5. ✅ **Auto-set outlet for USER/MANAGER** - Prevent cross-outlet order creation
6. ✅ **Add product mapping validation** - Enforce outlet_division_products constraint

### Important Enhancements:
7. ⚠️ **Implement role-based dashboard** - Different stats per role
8. ⚠️ **Add pagination to list endpoints** - As per requirements

### Already Fixed (from IMPLEMENTATION_SUMMARY.md):
- ✅ Register.jsx AuthContext integration
- ✅ OrderItem price from batch
- ✅ @PreAuthorize annotations
- ✅ Password change verification
- ✅ CORS configuration
- ✅ DTO validation annotations

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

1. **First:** Add outlet_id to User entity + database migration
2. **Second:** Remove stock validation from createOrder()
3. **Third:** Make OrderItem.batch nullable + update FIFO logic
4. **Fourth:** Implement outlet-scoped access control
5. **Fifth:** Add product mapping validation
6. **Sixth:** Implement pagination
7. **Seventh:** Create role-based dashboard

---

## ⚠️ BREAKING CHANGES WARNING

The following changes require database migrations and will break existing data:
- Adding outlet_id to users table
- Making batch_id nullable in order_items table

**Recommendation:** Create backup before applying these fixes.
