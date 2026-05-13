# Outlet Management System — Complete Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Roles & Access Control](#3-roles--access-control)
4. [Module-by-Module Functionality](#4-module-by-module-functionality)
5. [Role-wise Feature Matrix](#5-role-wise-feature-matrix)
6. [Application Flow](#6-application-flow)
7. [Dashboard Breakdown by Role](#7-dashboard-breakdown-by-role)
8. [Data Relationships](#8-data-relationships)
9. [Project Folder Structure](#9-project-folder-structure)

---

## 1. Project Overview

The **Outlet Management System** is a full-stack web application designed to manage a network of retail outlets. It handles the complete lifecycle of outlet operations — from setting up divisions and locations, registering outlets, managing products and batches, controlling stock levels, and processing orders — all with role-based access control.

**Core Purpose:**
- Centrally manage multiple retail outlets under one system
- Track product stock across outlets in real time
- Process and approve orders between outlets and the central system
- Provide analytics and KPI dashboards per role

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Material UI (MUI v5) |
| State Management | Redux Toolkit |
| Routing | React Router v6 |
| Charts | Recharts |
| Backend | Spring Boot (Java) |
| Database | MySQL / PostgreSQL (via JPA) |
| Auth | JWT Token (stored in localStorage) |
| Styling | CSS Modules + MUI `sx` prop |

---

## 3. Roles & Access Control

The system has **3 roles**. Every user is assigned exactly one role at creation time by the Admin.

---

### ADMIN
> The super-user. Has full access to every module in the system.

**Who is an Admin?**
- The system owner or head office manager
- Responsible for setting up the entire system structure
- Can see data across ALL outlets, divisions, and locations
- Can create, edit, and delete any record in the system

**What Admin can do:**
- Manage all users (create, edit, delete, assign roles and outlets)
- Create and manage Divisions
- Create and manage Locations
- Register and manage Outlets
- Add and manage Products and Batches
- View and transfer Stock across any outlet
- Create, approve, reject, and complete Orders for any outlet
- View full Dashboard with global KPIs (total users, global revenue, low stock alerts, total outlets)
- View all transaction history across all outlets

---

### MANAGER
> Outlet-level manager. Can manage operations but cannot touch system structure.

**Who is a Manager?**
- A person assigned to manage one or more outlets
- Can see and operate on outlet-level data
- Cannot manage users, divisions, or locations

**What Manager can do:**
- View Dashboard with outlet performance metrics and revenue charts
- View and manage Outlets (cannot create new ones — Admin only)
- Add and manage Products
- Add and manage Batches
- View Stock for their outlet and transfer stock between outlets
- Create Orders for their outlet
- Approve, reject, and complete Orders (PENDING → APPROVED → COMPLETED)
- Cannot access: User Management, Division, Location pages

---

### USER
> A basic outlet staff member. Limited to day-to-day operations only.

**Who is a User?**
- A staff member working at a specific outlet
- Assigned to one outlet via `outletId` in their profile
- Can only see data relevant to their assigned outlet

**What User can do:**
- View Dashboard with personal KPIs (active orders, pending orders, low stock, revenue)
- View Stock for their assigned outlet (read-only, no transfer)
- Create Orders for their assigned outlet
- View their own orders and their statuses
- Cannot approve or reject orders (only Admin/Manager can)
- Cannot access: User Management, Division, Location, Outlet, Product, Batch pages

---

## 4. Module-by-Module Functionality

---

### 4.1 Login & Authentication (`/`)

- JWT-based login
- On successful login, token + user data (name, email, role, outletId) stored in `localStorage`
- `AuthContext` provides role and user state globally across the app
- `ProtectedRoute` guards every page — redirects to `/unauthorized` if role doesn't match
- Session persists on page refresh via localStorage

---

### 4.2 Dashboard (`/dashboard`) — All Roles

The dashboard is **role-aware** — it shows different stats and charts depending on who is logged in.

**Admin Dashboard shows:**
- Total Users count
- Global Low Stock count (alert if any outlet has stock < threshold)
- Total Revenue (in Lakhs)
- Total Outlets count
- Outlet Performance chart (Area chart — efficiency over time)
- Revenue Stream chart (Bar chart — actual vs target weekly revenue)
- Division Analysis chart (Donut/Pie chart — outlet distribution by division)
- KPI Targets (Radar chart — Sales, Orders, Users, Inventory, Growth, Loyalty)
- Recent Activity (latest stock transactions)
- Recent Registrations (latest outlets added)

**Manager Dashboard shows:**
- Outlet Performance chart
- Revenue Stream chart
- KPI Targets (Radar chart — Efficiency, Orders, Attendance, Accuracy, Support, Stock)
- Recent Activity

**User Dashboard shows:**
- Active Orders count
- Pending Orders count
- Low Stock count (for their outlet)
- Revenue (in thousands)
- KPI Targets (personal performance)
- Recent Activity

---

### 4.3 User Management (`/users`) — ADMIN only

Manage all system users.

| Action | Description |
|---|---|
| View all users | Table with name, username, email, role, status |
| Add user | Create user with name, username, email, password, role, assigned outlet |
| Edit user | Update any user's details or role |
| Delete user | Permanently remove a user |
| Search | Filter users by name, username, email, or role |
| Role stats | Cards showing count of Admins, Managers, Users |

**Roles available when creating a user:** `ADMIN`, `MANAGER`, `USER`

---

### 4.4 Division (`/division`) — ADMIN only

Divisions represent business units or product categories (e.g., Dairy, Beverages, Snacks).

| Action | Description |
|---|---|
| View all divisions | List of all divisions |
| Add division | Create a new division with name and description |
| Edit division | Update division details |
| Delete division | Remove a division |

**Relationship:** Products belong to a Division. Outlets are mapped to Divisions.

---

### 4.5 Location (`/location`) — ADMIN only

Locations represent geographic areas where outlets operate (e.g., Chennai North, Coimbatore).

| Action | Description |
|---|---|
| View all locations | List of all locations |
| Add location | Create a location with name, state, district |
| Edit location | Update location details |
| Delete location | Remove a location |

**Relationship:** Each Outlet is linked to a Location.

---

### 4.6 Outlet (`/outlet`) — ADMIN + MANAGER

Outlets are the physical retail stores managed by the system.

| Action | Description |
|---|---|
| View all outlets | Table with outlet name, code, location, division, status |
| Add outlet | Register a new outlet (Admin only) |
| Edit outlet | Update outlet details |
| Delete outlet | Remove an outlet (Admin only) |
| Search & Filter | Filter by name, location, division |

**Outlet fields:** Outlet Name, Outlet Code, Location, Division, Address, Status (Active/Inactive)

---

### 4.7 Product (`/product`) — ADMIN + MANAGER

Products are the items sold/stocked at outlets.

| Action | Description |
|---|---|
| View all products | Table view or Card view (toggle) |
| Add product | Create product with name, code (auto-generated), division, UIM price, MRP, selling price, purchase price |
| Edit product | Update product details (code is read-only after creation) |
| Delete product | Remove a product |
| View product | Detailed view modal |
| Search | Filter by name, product code, division |
| Filter by division | Dropdown filter |
| Filter by price range | ₹0–100, ₹101–500, ₹501–1000, ₹1000+ |
| Pagination | Configurable page size (5, 10, 25, 50) |
| Price validation | Selling price and purchase price must be ≤ MRP |

**Product Code:** Auto-generated in format `MKL001`, `MKL002`, etc.

---

### 4.8 Batch (`/batch`) — ADMIN + MANAGER

Batches represent a specific stock intake of a product with a unique batch number, quantity, and expiry.

| Action | Description |
|---|---|
| View all batches | Table with batch number, product, quantity, expiry date, selling price |
| Add batch | Create a batch linked to a product |
| Edit batch | Update batch details |
| Delete batch | Remove a batch |
| Search & Filter | Filter by product, batch number |

**Relationship:** Each Batch belongs to a Product. Stock is tracked per Batch.

**FIFO Logic:** When an order is placed without specifying a batch, the system uses FIFO (First In, First Out) to allocate the oldest batch first.

---

### 4.9 Stock (`/stock`) — All Roles

Stock management tracks available and reserved quantities per outlet, per product, per batch.

#### Tab 1: Outlet Stock
| Column | Description |
|---|---|
| Outlet | Which outlet holds this stock |
| Product | Product name |
| Batch | Batch number |
| Available Qty | Current available quantity |
| Reserved Qty | Quantity reserved for pending orders |
| Level | Visual health indicator (Out of Stock / Low / Moderate / Healthy) |

**Stock Level Thresholds:**
- `Out of Stock` — qty = 0 (red)
- `Low Stock` — qty < 10 (amber)
- `Moderate` — qty < 30 (blue)
- `Healthy` — qty ≥ 30 (green)

#### Tab 2: Transaction History
Shows all stock movements with type, product, batch, outlet, quantity, created by, and date.

**Transaction Types:**
- `IN` — Stock received into outlet
- `OUT` — Stock dispatched from outlet
- `TRANSFER` — Stock moved between outlets

#### Stock Transfer (ADMIN + MANAGER only)
Transfer stock between two outlets:
1. Select source outlet
2. Select destination outlet
3. Select product
4. Select batch (shows available qty)
5. Enter quantity
6. Submit — creates IN and OUT transactions automatically

**USER role:** Can view stock for their assigned outlet only. Cannot transfer.

---

### 4.10 Orders (`/orders`) — All Roles

Orders represent a request to supply products to an outlet.

#### Order Statuses:
```
PENDING → APPROVED → COMPLETED
                ↘ REJECTED
         CANCELLED
```

| Status | Description |
|---|---|
| PENDING | Order created, awaiting approval |
| APPROVED | Approved by Admin/Manager |
| COMPLETED | Fulfilled and delivered |
| REJECTED | Denied by Admin/Manager |
| CANCELLED | Cancelled before processing |

#### Creating an Order:
1. Select outlet (Admin can select any; User/Manager auto-assigned to their outlet)
2. Add order items — each item has: Product, Batch (optional — FIFO if not selected), Quantity, Price
3. Multiple items per order supported
4. Submit order → status becomes PENDING

#### Order Actions by Role:

| Action | ADMIN | MANAGER | USER |
|---|---|---|---|
| Create order | ✅ (any outlet) | ✅ (their outlet) | ✅ (their outlet) |
| View orders | ✅ (all outlets) | ✅ (their outlet) | ✅ (their outlet) |
| Approve order | ✅ | ✅ | ❌ |
| Reject order | ✅ | ✅ | ❌ |
| Complete order | ✅ | ✅ | ❌ |
| Filter by outlet | ✅ | ❌ | ❌ |

#### Order Detail View:
- Visual timeline showing progress (Pending → Approved → Completed)
- Full item breakdown (product, batch, qty, price)
- Action buttons based on current status and role

---

## 5. Role-wise Feature Matrix

| Page / Feature | ADMIN | MANAGER | USER |
|---|---|---|---|
| Dashboard | ✅ Full | ✅ Outlet-level | ✅ Personal |
| User Management | ✅ Full CRUD | ❌ | ❌ |
| Division | ✅ Full CRUD | ❌ | ❌ |
| Location | ✅ Full CRUD | ❌ | ❌ |
| Outlet | ✅ Full CRUD | ✅ View + Edit | ❌ |
| Product | ✅ Full CRUD | ✅ Full CRUD | ❌ |
| Batch | ✅ Full CRUD | ✅ Full CRUD | ❌ |
| Stock — View | ✅ All outlets | ✅ All outlets | ✅ Own outlet |
| Stock — Transfer | ✅ | ✅ | ❌ |
| Stock — History | ✅ All | ✅ All | ✅ Own outlet |
| Orders — Create | ✅ Any outlet | ✅ Own outlet | ✅ Own outlet |
| Orders — Approve/Reject | ✅ | ✅ | ❌ |
| Orders — Complete | ✅ | ✅ | ❌ |
| Orders — View | ✅ All | ✅ Own outlet | ✅ Own outlet |

---

## 6. Application Flow

```
User visits /
     │
     ▼
Login Page
     │ (JWT token issued)
     ▼
AuthContext stores user + role
     │
     ▼
ProtectedRoute checks token + role
     │
     ├── ADMIN  → Full Dashboard + All Sidebar Items
     ├── MANAGER → Dashboard + Outlet/Product/Batch/Stock/Orders
     └── USER   → Dashboard + Stock + Orders
```

### Order Lifecycle Flow:
```
USER/MANAGER creates Order (PENDING)
        │
        ▼
ADMIN/MANAGER reviews Order
        │
        ├── Approve → APPROVED
        │       │
        │       ▼
        │   Mark Complete → COMPLETED
        │
        └── Reject → REJECTED
```

### Stock Flow:
```
Admin creates Batch (stock enters system)
        │
        ▼
Stock assigned to Outlet (IN transaction)
        │
        ▼
Order placed → stock reserved
        │
        ▼
Order completed → stock deducted (OUT transaction)
        │
        ▼
Transfer → stock moved between outlets (OUT + IN)
```

---

## 7. Dashboard Breakdown by Role

### ADMIN Dashboard
```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Total Users │ Global Low   │ Total        │ Total        │
│     5       │   Stock: 0   │ Revenue ₹L   │ Outlets: 0   │
└─────────────┴──────────────┴──────────────┴──────────────┘
┌──────────────────┬──────────────┬──────────────┐
│ Outlet           │ Revenue      │ Division     │
│ Performance      │ Stream       │ Analysis     │
│ (Area Chart)     │ (Bar Chart)  │ (Donut Chart)│
└──────────────────┴──────────────┴──────────────┘
┌──────────────────────────┬──────────────────────────────┐
│ KPI Targets              │ Recent Registrations         │
│ (Radar Chart)            │ (Outlet table)               │
├──────────────────────────┤                              │
│ Recent Activity          │                              │
│ (Transaction list)       │                              │
└──────────────────────────┴──────────────────────────────┘
```

### MANAGER Dashboard
```
┌──────────────────┬──────────────┐
│ Outlet           │ Revenue      │
│ Performance      │ Stream       │
│ (Area Chart)     │ (Bar Chart)  │
└──────────────────┴──────────────┘
┌──────────────────────────┐
│ KPI Targets (Radar)      │
├──────────────────────────┤
│ Recent Activity          │
└──────────────────────────┘
```

### USER Dashboard
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Active Orders│ Pending      │ Low Stock    │ Revenue      │
│              │ Orders       │              │ (₹K)         │
└──────────────┴──────────────┴──────────────┴──────────────┘
┌──────────────────────────┐
│ KPI Targets (Personal)   │
├──────────────────────────┤
│ Recent Activity          │
└──────────────────────────┘
```

---

## 8. Data Relationships

```
Division
  └── Products (many)
        └── Batches (many)
              └── OutletStock (per outlet)

Location
  └── Outlets (many)
        └── OutletStock (many)
        └── Orders (many)
              └── OrderItems (many)
                    └── Product + Batch

User
  └── Outlet (assigned one)
  └── Role (ADMIN / MANAGER / USER)
```

---

## 9. Project Folder Structure

```
outlet management system/
├── backend/                          # Spring Boot API
│   └── src/main/java/com/example/outletmanagement/
│       ├── entity/                   # JPA Entities
│       ├── repository/               # Spring Data Repositories
│       ├── service/                  # Business Logic
│       └── controller/               # REST Controllers
│
└── outlet-frontend/                  # React + Vite Frontend
    └── src/
        ├── api/
        │   └── apiClient.js          # Axios instance + endpoints
        ├── components/
        │   ├── MainLayout.jsx        # App shell (Sidebar + Navbar + Content)
        │   ├── Sidebar/              # Navigation sidebar (role-filtered)
        │   ├── Navbar/               # Top bar (search, clock, notifications, user)
        │   └── ProfileDrawer/        # User profile slide-out drawer
        ├── context/
        │   └── AuthContext.jsx       # Global auth state (user, role, login, logout)
        ├── pages/
        │   ├── Login/                # Login page
        │   ├── Register/             # Register page
        │   ├── Dashboard/            # Role-aware dashboard
        │   ├── UserManagement/       # ADMIN: manage users
        │   ├── Division/             # ADMIN: manage divisions
        │   ├── Location/             # ADMIN: manage locations
        │   ├── Outlet/               # ADMIN+MANAGER: manage outlets
        │   ├── Product/              # ADMIN+MANAGER: manage products
        │   ├── Batch/                # ADMIN+MANAGER: manage batches
        │   ├── Stock/                # ALL: view stock, transfer (Admin/Manager)
        │   ├── Orders/               # ALL: create orders, approve (Admin/Manager)
        │   └── Unauthorized/         # 403 page
        ├── redux/
        │   ├── store.js              # Redux store
        │   └── dashboardSlice.js     # Outlets, locations, divisions state
        ├── routes/
        │   ├── AppRoutes.jsx         # All route definitions with role guards
        │   └── ProtectedRoute.jsx    # Auth + role check wrapper
        └── services/                 # API service functions per module
            ├── authService.js
            ├── userService.js
            ├── divisionService.js
            ├── locationService.js
            ├── outletService.js
            ├── productService.js
            ├── batchService.js
            ├── stockService.js
            ├── orderService.js
            └── reportService.js
```

---

## Summary

| Role | Primary Responsibility | Key Restriction |
|---|---|---|
| **ADMIN** | Full system control — setup, users, all operations | None |
| **MANAGER** | Outlet operations — products, batches, stock, orders | Cannot manage users, divisions, locations |
| **USER** | Day-to-day outlet work — view stock, create orders | Cannot approve orders or manage any master data |
