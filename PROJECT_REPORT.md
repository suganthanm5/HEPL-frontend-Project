# 📊 HEPL Outlet Management System — Complete Project Report

> **Organization:** HEPL (Intern Project)  
> **Version:** v2.4.1  
> **Last Updated:** May 2026  
> **Report Generated:** 2026-05-22

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Backend — Spring Boot](#4-backend--spring-boot)
5. [Frontend — React/Vite](#5-frontend--reactvite)
6. [Database Design](#6-database-design)
7. [API Endpoints](#7-api-endpoints)
8. [Security & Authentication](#8-security--authentication)
9. [Key Features & Modules](#9-key-features--modules)
10. [Project File Structure](#10-project-file-structure)
11. [Environment Configuration](#11-environment-configuration)
12. [Known Issues & Pending Tasks](#12-known-issues--pending-tasks)

---

## 1. Project Overview

The **HEPL Outlet Management System (OMS)** is a full-stack web application designed to manage retail outlets, products, stock, orders, divisions, and user accounts for an enterprise. It provides a modern, responsive dashboard with role-based access control, real-time analytics, AI-powered chat assistance, and comprehensive export capabilities.

### Objectives
- Centralize management of multiple retail outlets under one platform
- Provide real-time stock tracking and low-stock alerts
- Support role-based access for Admins, Managers, and Users
- Enable data export (Excel/PDF) and report generation
- Offer a premium, enterprise-grade UI with dark/light mode support

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENT                            │
│         React 18 + Vite (SPA) on port :5173              │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP / REST API (Axios)
                            │ JWT Bearer Token
┌───────────────────────────▼──────────────────────────────┐
│                       BACKEND                            │
│         Spring Boot 3.2.4 (Java 17) on port :8080        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Controllers │→ │   Services   │→ │ Repositories  │  │
│  └──────────────┘  └──────────────┘  └───────┬───────┘  │
│                                              │           │
└──────────────────────────────────────────────┼───────────┘
                                               │ JPA / Hibernate
┌──────────────────────────────────────────────▼───────────┐
│                       DATABASE                           │
│              MySQL 8.x on port :3307                     │
│                  Database: `oms`                         │
└──────────────────────────────────────────────────────────┘
```

### Architecture Pattern
- **Backend:** Layered architecture — Controller → Service → Repository
- **Frontend:** Component-based SPA with Redux global state management
- **Communication:** RESTful JSON API with JWT stateless authentication
- **Auth Flow:** Username/Password + Google OAuth 2.0 (Access Token via UserInfo API)

---

## 3. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Core programming language |
| Spring Boot | 3.2.4 | Application framework |
| Spring Security | (Boot Managed) | Authentication & Authorization |
| Spring Data JPA | (Boot Managed) | ORM / Database access |
| Hibernate | (Boot Managed) | JPA implementation |
| MySQL | 8.x | Relational database |
| JJWT | 0.11.5 | JWT generation & validation |
| Lombok | 1.18.36 | Boilerplate reduction |
| SpringDoc OpenAPI | 2.5.0 | API documentation (Swagger UI) |
| Apache POI | 5.2.5 | Excel file generation for export |
| Google API Client | 2.2.0 | Google OAuth token verification |
| HikariCP | (Boot Managed) | Connection pool management |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 8.0.1 | Build tool & dev server |
| MUI (Material UI) | 9.0.0 | UI component library |
| Redux Toolkit | 2.11.2 | Global state management |
| React Router | 6.30.3 | Client-side routing |
| Axios | 1.13.6 | HTTP client for API calls |
| Recharts | 3.8.1 | Data visualization / charts |
| React Leaflet | 4.2.1 | Interactive maps (location view) |
| @react-oauth/google | 0.13.5 | Google OAuth 2.0 login |
| i18next | 26.2.0 | Internationalization (i18n) |
| ExcelJS | 4.4.0 | Client-side Excel export |
| JWT Decode | 4.0.0 | Decoding JWT tokens in browser |
| Lucide React | 1.11.0 | Icon library |
| Lodash Debounce | 4.0.8 | Search input debouncing |

---

## 4. Backend — Spring Boot

### 4.1 Package Structure

```
com.example.outletmanagement/
├── OutletManagementApplication.java    ← Entry point
├── config/
│   ├── ApplicationConfig.java          ← Beans: UserDetailsService, PasswordEncoder, AuthManager
│   ├── CorsConfig.java                 ← CORS filter configuration
│   ├── DataInitializer.java            ← Seed data on startup (locations, admin user, etc.)
│   ├── JpaAuditingConfig.java          ← Enables @CreatedDate / @LastModifiedDate
│   ├── JwtAuthenticationFilter.java    ← JWT filter: extracts & validates token per request
│   ├── JwtService.java                 ← JWT creation, extraction, validation
│   ├── OpenApiConfig.java              ← Swagger / OpenAPI configuration
│   └── SecurityConfig.java             ← Security filter chain, CORS, public routes
├── controller/
│   ├── AuthController.java             ← Login, Register, Validate, Google OAuth
│   ├── DivisionController.java         ← Division CRUD
│   ├── ExportController.java           ← Excel / report export endpoints
│   ├── HealthController.java           ← Health check
│   ├── LocationController.java         ← Location CRUD
│   ├── OrderController.java            ← Order management
│   ├── OutletController.java           ← Outlet CRUD
│   ├── OutletStockController.java      ← Stock management per outlet
│   ├── ProductBatchController.java     ← Product batch management
│   ├── ProductController.java          ← Product CRUD
│   ├── ReportController.java           ← Dashboard reports & analytics
│   ├── SpaRedirectController.java      ← Serves index.html for SPA routes
│   ├── TestController.java             ← Dev/test endpoints
│   └── UserController.java             ← User profile, password, upload picture
├── entity/                             ← JPA Entities (mapped to DB tables)
├── payload/                            ← DTOs (Request/Response objects)
├── repository/                         ← Spring Data JPA repositories
├── scheduler/                          ← Scheduled jobs (stock alerts, etc.)
├── service/                            ← Service interfaces
│   └── impl/                           ← Service implementations
├── specification/                      ← JPA Specifications for dynamic filtering
└── exception/                          ← Global exception handling
```

### 4.2 Key Configuration

**Database (MySQL on port 3307):**
```properties
spring.datasource.url=jdbc:mysql://localhost:3307/oms
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
```

**HikariCP Connection Pool:**
- Max pool size: **20**
- Min idle: **5**
- Connection timeout: **30s**

**CORS Allowed Origins:**
- `http://localhost:8080`
- `http://localhost:5173`
- `http://localhost:3000`
- `https://70rgsz56-8080.inc1.devtunnels.ms` (DevTunnel)

---

## 5. Frontend — React/Vite

### 5.1 Directory Structure

```
outlet-frontend/src/
├── App.jsx                ← Root component: ThemeProvider, BrowserRouter, AuthProvider
├── main.jsx               ← Entry point: Redux, GoogleOAuthProvider, React.StrictMode
├── index.css              ← Global CSS variables and base styles
├── api/
│   ├── apiClient.js       ← Axios instance with interceptors (JWT attach, 401 redirect)
│   └── userService.js     ← User-related API calls (profile, password, picture)
├── assets/                ← Images (outlet-bg.jpg, login-icon.png, etc.)
├── components/
│   ├── AIChat/            ← AI-powered chat assistant component
│   ├── ExportMenu/        ← Export to Excel/PDF dropdown component
│   ├── Navbar/            ← Top navigation bar
│   ├── ProfileDrawer/     ← Side drawer: user profile, activity, DB status
│   │   └── ModernProfileDrawer.jsx
│   ├── SearchableSelect/  ← Reusable searchable dropdown
│   ├── Sidebar/           ← Navigation sidebar with role-based menu items
│   ├── MainLayout.jsx     ← Wraps pages with Sidebar + Navbar
│   ├── BulkUploadModal.jsx← Bulk Excel product upload
│   └── TypingText.jsx     ← Animated typing text component
├── context/
│   └── AuthContext.jsx    ← Authentication context: login, logout, role, user state
├── pages/
│   ├── Login/             ← Login page (username/password + Google + Microsoft mock)
│   ├── Register/          ← User registration
│   ├── Dashboard/         ← Main analytics dashboard
│   ├── Product/           ← Product listing, CRUD, bulk upload
│   ├── Batch/             ← Product batch management
│   ├── Outlet/            ← Outlet management
│   ├── Stock/             ← Stock management per outlet
│   ├── Orders/            ← Order management
│   ├── Division/          ← Division management
│   ├── Location/          ← Location management with interactive map
│   ├── Reports/           ← Report generation
│   ├── UserManagement/    ← Admin user management
│   ├── NotificationPage/  ← Notification center
│   ├── Settings/          ← App settings (theme, language, security, preferences)
│   └── Unauthorized/      ← 403 Forbidden page
├── redux/
│   └── store.js           ← Redux store configuration
├── routes/
│   └── AppRoutes.jsx      ← Route definitions with PrivateRoute guard
├── services/
│   ├── authService.js     ← Login/Register API calls
│   └── userService.js     ← Profile API calls
├── theme/
│   └── theme.js           ← MUI theme (light/dark mode, purple primary palette)
└── utils/
    ├── cookieUtils.js     ← Cookie get/set/delete helpers
    └── translate.js       ← MyMemory API translation utilities
```

### 5.2 Routing & Access Control

| Route | Component | Access |
|---|---|---|
| `/` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | Authenticated |
| `/products` | Product | ADMIN, MANAGER |
| `/batches` | Batch | ADMIN, MANAGER |
| `/outlets` | Outlet | ADMIN, MANAGER |
| `/stock` | Stock | All Roles |
| `/orders` | Orders | All Roles |
| `/divisions` | Division | ADMIN |
| `/locations` | Location | ADMIN |
| `/users` | UserManagement | ADMIN |
| `/reports` | Reports | ADMIN, MANAGER |
| `/settings` | Settings | Authenticated |
| `/unauthorized` | Unauthorized | Public |

---

## 6. Database Design

### 6.1 Entity Map

```
Location ──────┐
               ↓
Division ──── Outlet ←────── User
               ↓
           Product ←──────── ProductBatch ← RequestBatch
               ↓
          OutletStock ←────── StockTransaction
               ↓
            Order ←──────── OrderItem
                              ↓
                           Product
```

### 6.2 Entities

| Entity | Table | Key Fields |
|---|---|---|
| `User` | `users` | id, username, email, password, role (ADMIN/MANAGER/USER), outlet_id, profile_picture, is_deleted |
| `Product` | `products` | id, name, product_code, mrp, selling_price, purchase_price, uim_price, division_id, is_deleted |
| `ProductBatch` | `product_batches` | id, product_id, batch_no, quantity, expiry_date, is_deleted |
| `Outlet` | `outlets` | id, name, address, location_id, is_deleted |
| `OutletStock` | `outlet_stocks` | id, outlet_id, product_id, quantity |
| `StockTransaction` | `stock_transactions` | id, outlet_id, product_id, type (IN/OUT), quantity, date |
| `Order` | `orders` | id, outlet_id, status, total_amount, order_date |
| `OrderItem` | `order_items` | id, order_id, product_id, quantity, price |
| `Division` | `divisions` | id, name, is_deleted |
| `Location` | `locations` | id, name, district, state |
| `OutletDivisionProduct` | `outlet_division_products` | outlet_id, division_id, product_id |

### 6.3 Soft Delete Pattern
All major entities use **soft delete**:
- `@SQLDelete(sql = "UPDATE <table> SET is_deleted = true WHERE id = ?")` — delete sets flag
- `@SQLRestriction("is_deleted = false")` — all queries automatically exclude deleted records

### 6.4 Audit Fields
All entities inherit from `BaseAuditEntity`:
- `created_at` (Date)
- `updated_at` (Date)
- `created_by` (String — username)
- `updated_by` (String — username)

---

## 7. API Endpoints

### Authentication — `/api/v1/auth`
| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Register new user | No |
| POST | `/login` | Username/password login → JWT | No |
| POST | `/google` | Google OAuth login → JWT | No |
| GET | `/validate` | Validate JWT token | No |

### Users — `/api/users`
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/profile` | Get current user profile | Yes |
| PUT | `/profile` | Update current user profile | Yes |
| PUT | `/change-password` | Change password (new password only) | Yes |
| POST | `/upload-picture` | Upload profile picture | Yes |
| GET | `/` | List all users (Admin) | ADMIN |
| POST | `/` | Create user (Admin) | ADMIN |
| PUT | `/{id}` | Update user by ID | ADMIN |
| DELETE | `/{id}` | Soft delete user | ADMIN |

### Products — `/api/products`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all products (filterable by division) |
| GET | `/{id}` | Get product by ID |
| POST | `/` | Create product |
| PUT | `/{id}` | Update product |
| DELETE | `/{id}` | Soft delete product |
| POST | `/bulk` | Bulk upload products via Excel |

### Outlets — `/api/outlets`
| GET/POST/PUT/DELETE | `/` and `/{id}` | Full CRUD for outlets |

### Stock — `/api/outlet-stock`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get all outlet stocks |
| GET | `/{outletId}` | Get stock for a specific outlet |
| PUT | `/{id}/adjust` | Adjust stock quantity |
| GET | `/low-stock` | Get products below threshold |

### Orders — `/api/orders`
| GET/POST/PUT/DELETE | Full order CRUD with status management |

### Reports — `/api/reports`
| GET | `/dashboard` | Dashboard KPIs |
| GET | `/sales` | Sales analytics |
| GET | `/stock-summary` | Stock overview |
| GET | `/low-stock-alert` | Low stock report |

### Export — `/api/export`
| GET | `/products` | Export products to Excel |
| GET | `/stock` | Export stock data to Excel |
| GET | `/orders` | Export orders to Excel |

### Other
| GET | `/api/health` | Health check |
| GET | `/api/divisions` | Division list |
| GET | `/api/locations` | Location list |

---

## 8. Security & Authentication

### 8.1 JWT Authentication Flow

```
User → POST /api/v1/auth/login
     → AuthController → AuthService.login()
     → AuthenticationManager.authenticate()
     → UserDetailsService.loadByUsername()
     → BCrypt password verify
     → JwtService.generateToken(user)
     → Returns: { token, username, email, role, outletId }
     
Subsequent requests:
     → JwtAuthenticationFilter intercepts
     → Extracts Bearer token from Authorization header
     → JwtService validates token (signature + expiry)
     → Sets SecurityContext with UsernamePasswordAuthenticationToken
     → Request proceeds to Controller
```

### 8.2 Google OAuth 2.0 Flow

```
User clicks "Google" button on Login page
→ useGoogleLogin() hook opens Google Account Chooser
→ Google returns an Access Token (credentialResponse.access_token)
→ Frontend: POST /api/v1/auth/google { token: access_token }
→ Backend: RestTemplate GET https://www.googleapis.com/oauth2/v3/userinfo
           with Authorization: Bearer <access_token>
→ Google returns { email, name, picture, ... }
→ If user exists (by email) → generate JWT
→ If new user → auto-register with USER role → generate JWT
→ Returns same AuthResponse as username/password login
```

### 8.3 Password Management
- Passwords are hashed using **BCrypt** (`PasswordEncoder`)
- **Change Password** flow: Only `newPassword` required — no old password check (convenient reset-style UX)
- Google-registered users get a randomly generated BCrypt hash as their internal password (they cannot use username/password login)

### 8.4 Role-Based Authorization
| Role | Access Level |
|---|---|
| `ADMIN` | Full access to all modules |
| `MANAGER` | Products, Outlets, Stock, Orders, Reports |
| `USER` | Stock view, Orders, Dashboard |

---

## 9. Key Features & Modules

### 9.1 Dashboard
- **KPI Cards:** Total Outlets, Products, Orders, Low Stock Alerts
- **Charts:** Sales trend (Recharts), Stock levels, Order distribution
- **Real-time data** from Reports API

### 9.2 Product Management
- Full CRUD with data grid table
- **Bulk Upload** via Excel file (Apache POI backend + ExcelJS frontend)
- Product filtering by Division
- Items-per-page pagination

### 9.3 Stock Management
- Per-outlet stock tracking
- **Low Stock Alerts** with configurable threshold
- Stock adjustment with audit trail (StockTransaction)

### 9.4 Location with Interactive Map
- React Leaflet integration
- Visual outlet location pinning on interactive map

### 9.5 Export System
- **Backend exports:** Apache POI generates Excel files (`.xlsx`)
- **Frontend exports:** ExcelJS allows client-side export
- Export available for Products, Stock, Orders

### 9.6 AI Chat Assistant
- Built-in chat component (`AIChat/`)
- Connected to backend AI service for context-aware Q&A

### 9.7 Modern Profile Drawer
- Slide-in profile panel (right side)
- Tabs: Profile details, Database connection status, Notifications, Messages, Activity log
- Profile picture upload (stored server-side at `/uploads/profile-pictures/`)

### 9.8 Settings Page
All settings are persisted in `localStorage`:

| Section | Settings |
|---|---|
| **General** | Theme (Dark/Light), Language, Time Format, Items Per Page |
| **Notifications** | Email, Push, Low Stock alerts |
| **Outlet Preferences** | Default outlet view, Auto-refresh interval, Low stock threshold |
| **Security** | Change Password (inline form — New + Confirm, no old password) |
| **System Info** | App version, Database connection status, Data management |

### 9.9 Internationalization (i18n)
- `react-i18next` + `i18next-browser-languagedetector`
- Manual translation fallback via **MyMemory API** (`utils/translate.js`)
- Language saved in `localStorage`

### 9.10 Theme System
- **Dark / Light mode** via MUI `ThemeProvider`
- Custom purple-based enterprise palette
- CSS variables synced across MUI and custom CSS components
- Theme persists in `localStorage`

---

## 10. Project File Structure

```
outlet management system/
│
├── backend/                                   ← Spring Boot Maven Project
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/example/outletmanagement/
│       │   ├── OutletManagementApplication.java
│       │   ├── config/           (8 files)
│       │   ├── controller/       (14 files)
│       │   ├── entity/           (13 files)
│       │   ├── exception/
│       │   ├── payload/          (DTOs)
│       │   ├── repository/
│       │   ├── scheduler/
│       │   ├── service/          (9 interfaces + impl/)
│       │   └── specification/
│       └── resources/
│           └── application.properties
│
├── outlet-frontend/                           ← React + Vite Project
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                                   ← Environment variables
│   │     VITE_API_BASE_URL=http://localhost:8080
│   │     VITE_GOOGLE_CLIENT_ID=<your-client-id>
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── api/            (apiClient.js, userService.js)
│       ├── assets/
│       ├── components/     (6 component groups)
│       ├── context/        (AuthContext.jsx)
│       ├── pages/          (15 pages)
│       ├── redux/          (store.js)
│       ├── routes/         (AppRoutes.jsx)
│       ├── services/       (authService.js, userService.js)
│       ├── theme/          (theme.js)
│       └── utils/          (cookieUtils.js, translate.js)
│
├── uploads/                                   ← Profile picture storage
│   └── profile-pictures/
│
├── TEST_API.bat                               ← API test helper script
└── package.json                               ← Monorepo root
```

---

## 11. Environment Configuration

### Backend (`application.properties`)
```properties
# MySQL
spring.datasource.url=jdbc:mysql://localhost:3307/oms
spring.datasource.username=root
spring.datasource.password=root

# Server
server.port=8080

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:8080,...

# Swagger
springdoc.swagger-ui.path=/swagger-ui.html
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK=false
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
```

---

## 12. Known Issues & Pending Tasks

### ✅ Completed
- [x] Role-based access control (ADMIN / MANAGER / USER)
- [x] JWT authentication with secure cookie storage
- [x] Google OAuth 2.0 login with auto-registration
- [x] Dark/Light theme toggle
- [x] Change Password — no old password required (reset-style)
- [x] Profile picture upload
- [x] Bulk product upload via Excel
- [x] Export to Excel (Products, Stock, Orders)
- [x] Items-per-page setting (persisted, applied globally)
- [x] Low stock alert with configurable threshold
- [x] Soft delete pattern across all entities
- [x] Internationalization (i18n) with language switching
- [x] AI Chat integration
- [x] Interactive map for locations

### ⚠️ Pending / Known Limitations
- [ ] **Microsoft Login** — Currently a **mock button** (no actual Microsoft OAuth integration)
- [ ] **Google button** — Uses custom styled button; requires backend restart on each new deploy for Google UserInfo API calls
- [ ] **Change Password** — Does not require old password. For stricter security, consider adding a verification step
- [ ] **Low Stock Scheduler** — Background job exists (`scheduler/`) but alert delivery mechanism needs end-to-end testing
- [ ] **Password Reset via Email** — Not implemented; only session-based password change exists
- [ ] **Audit Logs** — `created_by` / `updated_by` fields exist but the JPA auditing populator may need verification with the current Spring Security context
- [ ] **Backend Deployment** — DevTunnel URL is hardcoded in CORS config; needs environment-based configuration for production

---

## 📌 Quick Start Guide

### Start Backend
1. Open project in Eclipse / Spring Tool Suite
2. Right-click `OutletManagementApplication.java` → Run As → Spring Boot App
3. Server starts on `http://localhost:8080`
4. Swagger UI: `http://localhost:8080/swagger-ui.html`

### Start Frontend
```bash
cd outlet-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Default Admin Credentials
```
Username: admin
Password: admin123
Role: ADMIN
```
*(Seeded by `DataInitializer.java` on first startup)*

---

*Report generated automatically from source code analysis — HEPL Outlet Management System, May 2026*
