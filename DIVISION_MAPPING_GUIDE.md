# Division Entity Mapping Guide

## Overview
This document outlines how the Division entity is mapped across all necessary pages and services in the Outlet Management System.

---

## Backend Mapping

### 1. Entity Layer
**File:** `backend/src/main/java/com/example/outletmanagement/entity/Division.java`

```java
@Entity
@Table(name = "divisions")
public class Division extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @JsonManagedReference
    @OneToMany(mappedBy = "division", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Product> products;
}
```

**Audit Fields (inherited from BaseAuditEntity):**
- `createdAt` - Timestamp when division was created
- `updatedAt` - Timestamp when division was last updated
- `createdBy` - User who created the division
- `updatedBy` - User who last updated the division
- `isDeleted` - Soft delete flag

---

### 2. DTO Layer

#### Request DTO
**File:** `backend/src/main/java/com/example/outletmanagement/payload/dto/request/DivisionRequest.java`

```java
@Data
public class DivisionRequest {
    private String name;
}
```

#### Response DTO
**File:** `backend/src/main/java/com/example/outletmanagement/payload/dto/response/DivisionResponse.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DivisionResponse {
    private Long id;
    private String name;
    private List<ProductResponse> products;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
```

---

### 3. Repository Layer
**File:** `backend/src/main/java/com/example/outletmanagement/repository/DivisionRepository.java`

```java
@Repository
public interface DivisionRepository extends JpaRepository<Division, Long>, JpaSpecificationExecutor<Division> {
    @Query("SELECT DISTINCT d FROM Division d LEFT JOIN FETCH d.products WHERE d.id = :id")
    Optional<Division> findByIdWithProducts(@Param("id") Long id);
    
    Page<Division> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
```

**Key Methods:**
- `findByIdWithProducts()` - Fetches division with all products (eager loading)
- `findByNameContainingIgnoreCase()` - Search divisions by name (case-insensitive)

---

### 4. Service Layer
**File:** `backend/src/main/java/com/example/outletmanagement/service/impl/DivisionServiceImpl.java`

**Mapping Methods:**

```java
private DivisionResponse mapToResponse(Division division) {
    return DivisionResponse.builder()
            .id(division.getId())
            .name(division.getName())
            .createdAt(division.getCreatedAt())
            .updatedAt(division.getUpdatedAt())
            .createdBy(division.getCreatedBy())
            .updatedBy(division.getUpdatedBy())
            .products(division.getProducts() == null || division.getProducts().isEmpty() ? List.of() : 
                    division.getProducts().stream()
                            .filter(p -> p != null)
                            .map(p -> ProductResponse.builder()
                                    .id(p.getId())
                                    .name(p.getName())
                                    .productCode(p.getProductCode())
                                    .uimPrice(p.getUimPrice())
                                    .mrp(p.getMrp())
                                    .sellingPrice(p.getSellingPrice())
                                    .purchasePrice(p.getPurchasePrice())
                                    .build())
                            .collect(Collectors.toList()))
            .build();
}
```

**Service Methods:**
- `createDivision(DivisionRequest)` - Create new division
- `getAllDivisions(String search, Boolean hasProducts, Pageable)` - Paginated list with search
- `getDivisionById(Long id)` - Get single division with products
- `updateDivision(Long id, DivisionRequest)` - Update division
- `deleteDivision(Long id)` - Soft delete division

---

### 5. Controller Layer
**File:** `backend/src/main/java/com/example/outletmanagement/controller/DivisionController.java`

**Endpoints:**
- `POST /api/divisions` - Create division (ADMIN, MANAGER)
- `GET /api/divisions` - List divisions with pagination (ADMIN, MANAGER, USER)
- `GET /api/divisions/{id}` - Get division details (ADMIN, MANAGER, USER)
- `PUT /api/divisions/{id}` - Update division (ADMIN)
- `DELETE /api/divisions/{id}` - Delete division (ADMIN)

---

## Frontend Mapping

### 1. Service Layer
**File:** `outlet-frontend/src/services/devisionService.js`

```javascript
const getDivisions = async (page = 0, size = 10, keyword = "", signal) => {
  const res = await API.get(ENDPOINTS.divisions, { 
    params: { page, size, ...(keyword ? { keyword } : {}) }, 
    signal 
  });
  return res.data?.data || { content: [], totalPages: 0, totalElements: 0 };
};

const createDivision = async (data) => {
  const res = await API.post(ENDPOINTS.divisions, data);
  return res.data?.data || res.data;
};

const updateDivision = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.divisions}/${id}`, data);
  return res.data?.data || res.data;
};

const deleteDivision = async (id) => {
  await API.delete(`${ENDPOINTS.divisions}/${id}`);
};
```

---

### 2. Pages Using Division Mapping

#### A. Division Management Page
**File:** `outlet-frontend/src/pages/Division/Division.jsx`

**Features:**
- List divisions with pagination
- Search divisions by name
- Filter by product count (0, 1-5, 6-10, 10+)
- Filter by creation date (Last 7/30/90 days)
- Add single or multiple divisions (comma-separated)
- Edit division name
- Delete division (soft delete)
- View division details with audit info
- Manage products within division
- Table and Card view modes

**Division Data Displayed:**
```javascript
{
  id: Long,
  name: String,
  products: Array<ProductResponse>,
  createdAt: LocalDateTime,
  updatedAt: LocalDateTime,
  createdBy: String,
  updatedBy: String
}
```

---

#### B. Product Management Page
**File:** `outlet-frontend/src/pages/Product/Product.jsx`

**Division Integration:**
- Fetch all divisions on page load
- Display division name for each product
- Filter products by division
- Assign product to division during creation/edit
- Show division in product details modal

**Division Mapping:**
```javascript
const divMap = useMemo(() => 
  Object.fromEntries(divisions.map((d) => [d.id, d.name])), 
  [divisions]
);
const divNameOf = (p) => p.division?.name ?? divMap[p.divisionId] ?? "—";
```

---

#### C. Outlet Management Page
**File:** `outlet-frontend/src/pages/Outlet/Outlet.jsx`

**Division Integration:**
- Fetch divisions on page load
- Multi-select divisions for outlet
- Select products from selected divisions
- Display divisions assigned to outlet
- Filter outlets by division
- Show division-product mappings

**Division Mapping:**
```javascript
const selectedDivisions = []; // Array of selected Division objects
const form.mappings = {
  [divisionId]: [productId1, productId2, ...] // Division to Products mapping
};
```

---

#### D. Dashboard Page
**File:** `outlet-frontend/src/pages/Dashboard/Dashboard.jsx`

**Division Integration:**
- Display total divisions count
- Show "Outlets by Division" pie chart
- Calculate total products across all divisions
- Display division statistics

**Division Data Usage:**
```javascript
const divisions = useSelector(s => s.dashboard.divisions);
const totalProducts = divisions.reduce((sum, div) => sum + (div.products?.length || 0), 0);
```

---

### 3. Redux State Management
**File:** `outlet-frontend/src/redux/dashboardSlice.js`

**State Structure:**
```javascript
{
  dashboard: {
    divisions: Array<DivisionResponse>,
    outlets: Array<OutletResponse>,
    locations: Array<LocationResponse>,
    loading: Boolean
  }
}
```

**Actions:**
- `fetchDashboardData()` - Fetch divisions, outlets, locations
- `addDivision(division)` - Add division to state
- `setDashboardData(data)` - Set all dashboard data

---

## Data Flow Diagram

```
Backend (Java)
├── Division Entity (with audit fields)
├── DivisionRequest DTO (input)
├── DivisionResponse DTO (output with audit fields)
├── DivisionRepository (queries)
├── DivisionService (business logic)
└── DivisionController (REST endpoints)
        ↓
API Response (JSON)
        ↓
Frontend (React)
├── devisionService.js (API calls)
├── Redux dashboardSlice (state management)
└── Pages:
    ├── Division.jsx (CRUD operations)
    ├── Product.jsx (Division selection)
    ├── Outlet.jsx (Division-Product mapping)
    └── Dashboard.jsx (Division statistics)
```

---

## API Response Format

### List Divisions Response
```json
{
  "httpStatus": 200,
  "message": "Divisions fetched successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "name": "North Region",
        "products": [
          {
            "id": 1,
            "name": "Product A",
            "productCode": "MKL001",
            "uimPrice": 100,
            "mrp": 150,
            "sellingPrice": 140,
            "purchasePrice": 80
          }
        ],
        "createdAt": "2024-01-15T10:30:00",
        "updatedAt": "2024-01-20T14:45:00",
        "createdBy": "admin",
        "updatedBy": "manager"
      }
    ],
    "totalPages": 1,
    "totalElements": 1,
    "currentPage": 0,
    "pageSize": 10
  }
}
```

---

## Validation Rules

### Division Name
- **Required:** Yes
- **Type:** String
- **Unique:** Yes (case-insensitive)
- **Max Length:** 255 characters
- **Allowed Characters:** Letters, spaces, commas
- **Cannot Start With:** Space or comma

### Division Creation
- **Permission:** ADMIN, MANAGER
- **Validation:** Check for duplicate names
- **Soft Delete:** Enabled (is_deleted flag)

### Division Update
- **Permission:** ADMIN only
- **Validation:** Check for duplicate names (excluding current)
- **Audit:** Updates createdBy and updatedAt fields

### Division Deletion
- **Permission:** ADMIN only
- **Type:** Soft delete (sets is_deleted = true)
- **Cascade:** Products remain but division reference is removed

---

## Key Features

### 1. Pagination
- Default page size: 10
- Configurable sizes: 5, 10, 25, 50
- Total elements and pages returned

### 2. Search
- Case-insensitive search by name
- Debounced search (300ms delay)
- Real-time filtering

### 3. Filtering
- By product count
- By creation date
- Combined filters supported

### 4. Audit Trail
- Created timestamp and user
- Updated timestamp and user
- Soft delete support

### 5. Relationships
- One Division → Many Products
- One Division → Many Outlets (through mappings)
- Cascade delete for products

---

## Testing Checklist

- [ ] Create division with valid name
- [ ] Create multiple divisions (comma-separated)
- [ ] Prevent duplicate division names
- [ ] Update division name
- [ ] Delete division (soft delete)
- [ ] Search divisions by name
- [ ] Filter by product count
- [ ] Filter by creation date
- [ ] Paginate through divisions
- [ ] View division details with audit info
- [ ] Manage products within division
- [ ] Assign division to product
- [ ] Assign division to outlet
- [ ] Display divisions in dashboard
- [ ] Verify audit fields are populated

---

## Summary

The Division entity is comprehensively mapped across:
1. **Backend:** Entity → DTO → Service → Controller
2. **Frontend:** Service → Redux → Pages (Division, Product, Outlet, Dashboard)
3. **Features:** CRUD, Search, Filter, Pagination, Audit Trail, Relationships
4. **Security:** Role-based access control (ADMIN, MANAGER, USER)
5. **Data Integrity:** Unique constraints, soft delete, cascade operations
