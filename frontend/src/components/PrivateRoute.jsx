import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  // Check if a token exists in localStorage
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If the token exists, check if the role matches the route
  if ((role === "Admin" || role === "BusinessOwner" || role === "Manager") && window.location.pathname.startsWith("/admindashboard")) {
    return <Outlet />;
  } else if (role !== "Admin" && window.location.pathname.startsWith("/admindashboard")) {
    // Redirect non-admin users from admin routes
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
