import React from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Navigate } from "react-router-dom";

const RequireAdminAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/company/admin-login" replace />;
  return <>{children}</>;
};

export default RequireAdminAuth;

