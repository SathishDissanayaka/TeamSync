import React from "react";
import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  const role = localStorage.getItem("role"); // Retrieve role from localStorage

  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        {/* Admin Dashboard Route */}
        {role === "Admin" || role === "BusinessOwner" || role === "Manager"? (
          <Route path="/admindashboard/*" element={<AdminDashboard />} />
        ) : (
          // Employee Dashboard Route
          <Route path="/dashboard/*" element={<Dashboard />} />
        )}
      </Route>
    </Routes>
  );
};

export default App;
