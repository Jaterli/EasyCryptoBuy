import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  token: string | null;
  username: string | null;  
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, username: string) => void;
  logout: () => void;
}

const CompanyAuthContext = createContext<AuthContextType | undefined>(undefined);

export const CompanyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("companyToken"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("companyUsername"));
  
  const login = (accessToken: string, refreshToken: string, username: string) => {
    localStorage.setItem("companyToken", accessToken);
    localStorage.setItem("companyRefreshToken", refreshToken);
    localStorage.setItem("companyUsername", username);
    setToken(accessToken);
    setUsername(username);
  };
  
  const logout = () => {
    localStorage.removeItem("companyToken");
    localStorage.removeItem("companyRefreshToken");
    localStorage.removeItem("companyUsername");
    setToken(null);
    setUsername(null);
  };
  
  const value = {
    token,
    username,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <CompanyAuthContext.Provider value={value}>{children}</CompanyAuthContext.Provider>;
};

export const useCompanyAuth = () => {
  const context = useContext(CompanyAuthContext);
  if (!context) throw new Error("usecompanyAuth must be used within CompanyAuthProvider");
  return context;
};
