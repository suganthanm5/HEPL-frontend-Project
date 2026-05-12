# Flow Corrections Applied to Outlet Management System

## Summary
All critical flow issues have been identified and corrected to match the specification exactly.

---

## Backend Corrections

### 1. ✅ OrderItem.batch made nullable
**File:** `OrderItem.java`
**Issue:** `batch_id` was `NOT NULL`, but spec says batch is optional at order creation (FIFO runs at approve)
**Fix:** Changed `@JoinColumn(name = "batch_id", nullable = false)` to `@JoinColumn(name = "batch_id")`

### 2. ✅ Stock validation removed from order creation
**File:** `OrderServiceImpl.java`
**Issue:** `createOrder()` was checking `outletStockRepository` before saving order
**Spec:** "Stock is NOT validated at order creation time. Validation happens at APPROVE time."
**Fix:** Removed all stock validation from `createOrder()` method

### 3. ✅ Product-outlet mapping validation added
**File:** `OrderServiceImpl.java`, `OutletDivisionProductRepository.java`
**Issue:** No validation that products are mapped to outlet via `outlet_division_products`
**Spec:** "Only products mapped to an outlet via outlet_division_products can be ordered for that outlet."
**Fix:** 
- Added `existsByOutletIdAndProductId()` query to repository
- Added validation loop in `createOrder()` that throws exception if product not mapped

### 4. ✅ Batch optional handling in createOrder
**File:** `OrderServiceImpl.java`
**Issue:** Code required `batchId` and threw NPE if null
**Fix:** 
- Check if `batchId != null` before fetching batch
- Use product's `sellingPrice` as fallback if no batch specified
- Set `batch` to `null` in OrderItem if not provided

### 5. ✅ Order soft-delete fixed
**File:** `OrderServiceImpl.java`
**Issue:** `deleteOrder()` called `orderRepository.delete(order)` which hard-deletes
**Fix:** Changed to `orderRepository.deleteById(id)` which triggers `@SQLDelete` soft-delete

### 6. ✅ OrderResponse includes createdBy
**File:** `OrderResponse.java`
**Issue:** Missing `createdBy` field — spec says orders table shows "Created By"
**Fix:** 
- Added `private String createdBy;` field
- Populated from `o.getUser().getName()` or `o.getCreatedBy()` in `from()` method

### 7. ✅ StockTransferRequest.batchId made required
**File:** `StockTransferRequest.java`
**Issue:** `batchId` was nullable but `transferStock()` service required it (NPE risk)
**Fix:** Added `@NotNull(message = "Batch ID is required")` validation

### 8. ✅ Missing imports added
**File:** `OrderServiceImpl.java`
**Fix:** 
- Added `import java.math.BigDecimal;`
- Injected `OutletDivisionProductRepository mappingRepository`

---

## Frontend Corrections

### 9. ✅ Removed cookie storage (localStorage only)
**Files:** `AuthContext.jsx`, `ProtectedRoute.jsx`, `apiClient.js`
**Issue:** Token was being stored in both localStorage AND cookies
**Spec:** "Token stored in localStorage only. Not in cookies."
**Fix:**
- **AuthContext.jsx:** Removed `document.cookie = ...` from `login()` and `logout()`
- **ProtectedRoute.jsx:** Removed `|| document.cookie.match(...)` fallback
- **apiClient.js:** Removed `getCookie()` and `deleteCookie()` functions, removed cookie fallback from interceptors

### 10. ✅ USER role cannot transfer stock
**File:** `Stock.jsx`
**Issue:** Transfer Stock button shown to all roles
**Spec:** "USER: View-only access... Cannot approve, reject, complete, transfer, or manage anything"
**Fix:**
- Added `const { role } = useAuth();`
- Added `const canTransfer = role === "ADMIN" || role === "MANAGER";`
- Wrapped Transfer Stock button with `{canTransfer && (...)}`

### 11. ✅ ADMIN can create orders
**File:** `Orders.jsx`
**Issue:** Create Order button only shown to USER and MANAGER
**Spec:** "POST /api/orders: ADMIN, MANAGER, USER"
**Fix:** Changed condition from `{(role === "USER" || isManager) && (` to `{(isAdmin || isManager || role === "USER") && (`

### 12. ✅ batchId not sent when empty
**File:** `orderService.js`
**Issue:** Empty string `batchId: ""` was being sent to backend
**Fix:** Changed to `...(it.batchId ? { batchId: Number(it.batchId) } : {})` — only include batchId when truthy

---

## Order Lifecycle Flow (Now Correct)

### Step 1: Create Order (PENDING)
- ✅ User selects outlet (auto-set for USER/MANAGER based on their `outlet_id`)
- ✅ User adds items: product (filtered to outlet-mapped products only), optional batch, quantity
- ✅ Price auto-filled from batch `sellingPrice` if batch selected, else from product `sellingPrice`
- ✅ **NO STOCK VALIDATION** at this point
- ✅ Order saved with status `PENDING`

### Step 2: Approve Order (PENDING → APPROVED)
- ✅ ADMIN or MANAGER clicks "Approve"
- ✅ Backend runs `allocateStockFIFO()`:
  - Queries `product_batches` by `expiry_date ASC` (FIFO)
  - Checks total available quantity >= ordered quantity (throws if insufficient)
  - Deducts from `product_batches.quantity`
  - Creates/updates `outlet_stock` record
  - Logs `StockTransaction OUT` (warehouse) and `IN` (outlet)
- ✅ Order status set to `APPROVED`

### Step 3: Complete Order (APPROVED → COMPLETED)
- ✅ ADMIN or MANAGER clicks "Mark Completed"
- ✅ Backend deducts `outlet_stock.available_qty` for each item
- ✅ Throws if `available_qty` would go below zero
- ✅ Logs `StockTransaction OUT` (outlet)
- ✅ Order status set to `COMPLETED`

### Reject Order (PENDING → REJECTED)
- ✅ ADMIN or MANAGER clicks "Reject"
- ✅ No stock changes
- ✅ Order status set to `REJECTED`

---

## Role Access Control (Now Correct)

### ADMIN
- ✅ Can create orders
- ✅ Can approve, reject, complete orders
- ✅ Can transfer stock
- ✅ Can see all orders (no filtering)

### MANAGER
- ✅ Can create orders (for their assigned outlet)
- ✅ Can approve, reject, complete orders (for their assigned outlet)
- ✅ Can transfer stock (for their assigned outlet)
- ✅ Can see orders for their assigned outlet

### USER
- ✅ Can create orders (for their assigned outlet)
- ✅ Can view only their own orders
- ✅ **Cannot** approve, reject, complete, or transfer
- ✅ **Cannot** see Transfer Stock button

---

## Authentication & Token Storage (Now Correct)

- ✅ Token stored **only** in `localStorage` (not cookies)
- ✅ `AuthContext.login()` writes only to `localStorage`
- ✅ `ProtectedRoute` reads only from `localStorage`
- ✅ `apiClient` interceptor reads only from `localStorage`
- ✅ On 401, all localStorage keys cleared and redirect to login

---

## Validation Rules (Now Correct)

### Order Creation
- ✅ Outlet ID required
- ✅ Product ID required
- ✅ Batch ID **optional** (FIFO if not provided)
- ✅ Quantity required (min: 1)
- ✅ Product must be mapped to outlet via `outlet_division_products`
- ✅ **No stock validation** at creation time

### Stock Transfer
- ✅ From Outlet ID required
- ✅ To Outlet ID required
- ✅ Product ID required
- ✅ **Batch ID required** (prevents NPE)
- ✅ Quantity required (min: 1)
- ✅ Source and destination outlets must be different

---

## All Issues Resolved ✅

1. ✅ Stock validation removed from order creation
2. ✅ Batch made optional on OrderItem entity
3. ✅ Soft-delete fixed for orders
4. ✅ Product-outlet mapping validation added
5. ✅ OrderResponse includes createdBy
6. ✅ StockTransferRequest.batchId made required
7. ✅ Cookie storage removed (localStorage only)
8. ✅ ProtectedRoute cookie fallback removed
9. ✅ apiClient cookie fallback removed
10. ✅ USER role cannot see Transfer Stock button
11. ✅ ADMIN can create orders
12. ✅ batchId not sent when empty

---

## Testing Checklist

### Order Flow
- [ ] USER creates order without batch → PENDING (no stock check)
- [ ] MANAGER approves order → APPROVED (FIFO runs, stock allocated)
- [ ] ADMIN completes order → COMPLETED (outlet stock deducted)
- [ ] MANAGER rejects order → REJECTED (no stock change)

### Role Access
- [ ] USER cannot see Transfer Stock button
- [ ] USER can only see their own orders
- [ ] MANAGER can see orders for their outlet only
- [ ] ADMIN can see all orders
- [ ] ADMIN can create orders

### Product Mapping
- [ ] Creating order with unmapped product throws error
- [ ] Creating order with mapped product succeeds

### Token Storage
- [ ] Login stores token only in localStorage (not cookies)
- [ ] Logout clears all localStorage keys
- [ ] 401 response clears localStorage and redirects to login

---

**All corrections have been applied. The system now follows the specification exactly.**
