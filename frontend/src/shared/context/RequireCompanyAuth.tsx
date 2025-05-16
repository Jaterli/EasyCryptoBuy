import React from "react";
import { useCompanyAuth } from "./CompanyAuthContext";
import { Navigate } from "react-router-dom";

const RequireCompanyAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useCompanyAuth();
  if (!isAuthenticated) return <Navigate to="/company/company-login" replace />;
  return <>{children}</>;
};

export default RequireCompanyAuth;

