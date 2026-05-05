import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Outlet from "../pages/Outlet/Outlet";
import Location from "../pages/Location/Location";
import Division from "../pages/Division/Division";
import Register from "../pages/Register/Register";
import Product from "../pages/Product/Product";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const PrivateRoute = ({ children }) => {
  const token = getCookie("token") || localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/outlet" element={<PrivateRoute><Outlet /></PrivateRoute>} />
    <Route path="/location" element={<PrivateRoute><Location /></PrivateRoute>} />
    <Route path="/division" element={<PrivateRoute><Division /></PrivateRoute>} />
    <Route path="/product" element={<PrivateRoute><Product /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;
