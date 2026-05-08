import { Routes, Route, Navigate } from "react-router-dom";

/* Existing pages */
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Outlet from "../pages/Outlet/Outlet";
import Location from "../pages/Location/Location";
import Division from "../pages/Division/Division";
import Product from "../pages/Product/Product";

/* New pages */
import UserManagement from "../pages/UserManagement/UserManagement";
import Batch from "../pages/Batch/Batch";
import Stock from "../pages/Stock/Stock";
import Orders from "../pages/Orders/Orders";
import Unauthorized from "../pages/Unauthorized/Unauthorized";

/* Layout & guards */
import MainLayout from "../components/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

/* ── Shorthand helpers ───────────────────────────── */

/** Any authenticated user */
const Private = ({ children, title }) => (
  <ProtectedRoute>
    <MainLayout title={title}>{children}</MainLayout>
  </ProtectedRoute>
);

/** Restricted to specific roles */
const RoleRoute = ({ children, title, roles }) => (
  <ProtectedRoute roles={roles}>
    <MainLayout title={title}>{children}</MainLayout>
  </ProtectedRoute>
);

/* ── Routes ──────────────────────────────────────── */
const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/unauthorized" element={<Unauthorized />} />

    {/* All authenticated users */}
    <Route path="/dashboard" element={<Private title="Dashboard"><Dashboard /></Private>} />
    <Route path="/stock" element={<Private title="Stock Management"><Stock /></Private>} />
    <Route path="/orders" element={<Private title="Orders"><Orders /></Private>} />

    {/* Admin + Manager */}
    <Route path="/outlet" element={<RoleRoute title="Outlet Management" roles={["ADMIN", "MANAGER"]}><Outlet /></RoleRoute>} />
    <Route path="/product" element={<RoleRoute title="Product Management" roles={["ADMIN", "MANAGER"]}><Product /></RoleRoute>} />
    <Route path="/batch" element={<RoleRoute title="Batch Management" roles={["ADMIN", "MANAGER"]}><Batch /></RoleRoute>} />

    {/* Admin only */}
    <Route path="/division" element={<RoleRoute title="Division Management" roles={["ADMIN"]}><Division /></RoleRoute>} />
    <Route path="/location" element={<RoleRoute title="Location Management" roles={["ADMIN"]}><Location /></RoleRoute>} />
    <Route path="/users" element={<RoleRoute title="User Management" roles={["ADMIN"]}><UserManagement /></RoleRoute>} />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
