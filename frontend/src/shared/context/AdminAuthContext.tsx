import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  token: string | null;
  username: string | null;  
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, username: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("adminToken"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("adminUsername"));
  
  const login = (accessToken: string, refreshToken: string, username: string) => {
    localStorage.setItem("adminToken", accessToken);
    localStorage.setItem("adminRefreshToken", refreshToken);
    localStorage.setItem("adminUsername", username);
    setToken(accessToken);
    setUsername(username);
  };
  
  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUsername");
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

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
};
