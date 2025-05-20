import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    const storedUser = sessionStorage.getItem("authenticatedUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (authenticatedUser) {
      sessionStorage.setItem("authenticatedUser", JSON.stringify(authenticatedUser));
    } else {
      sessionStorage.removeItem("authenticatedUser");
    }
  }, [authenticatedUser]);

  return (
    <AuthContext.Provider value={{ authenticatedUser, setAuthenticatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
