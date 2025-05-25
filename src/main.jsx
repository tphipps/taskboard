// main.jsx (App logic using AuthProvider with login timeout)

import "./index.css";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import LoginBox from "./components/LoginBox";
import TaskBoard from "./components/TaskBoard";
import TaskApprovalTable from "./components/TaskApprovalTable";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SessionTimeoutModal from "./components/SessionTimeoutModal";

import { logout } from "./lib/api";

const AppRoutes = () => {
  const { authenticatedUser, setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const countdownRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasStartedTracking = useRef(false);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearTimeout(countdownRef.current);
    timeoutRef.current = setTimeout(() => setShowTimeoutModal(true), 5 * 60 * 1000); // 5 min idle timeout
  };

  const stopTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearTimeout(countdownRef.current);
    setShowTimeoutModal(false);
  };

  const handleActivity = () => {
    if (authenticatedUser && !showTimeoutModal) resetTimer();
  };

  const handleRemainLoggedIn = () => {
    setShowTimeoutModal(false);
    resetTimer();
  };

  const handleLogout = async () => {
    try {
      const res = await logout();
      if (res.status === 200) {
        stopTimer();
        setAuthenticatedUser(null);
        sessionStorage.removeItem("authenticatedUser");
        navigate("/login");
      } else {
        throw new Error("network error");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      stopTimer();
      sessionStorage.removeItem("authenticatedUser");
      setAuthenticatedUser(null);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (authenticatedUser && !hasStartedTracking.current) {
      hasStartedTracking.current = true;
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("keydown", handleActivity);
      resetTimer();
    }
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      clearTimeout(timeoutRef.current);
      clearTimeout(countdownRef.current);
    };
  }, [authenticatedUser, showTimeoutModal]);

  if (authenticatedUser === undefined) return null; // optional loading fallback

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            authenticatedUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            <LoginBox
              onLogin={(user) => {
                stopTimer();
                hasStartedTracking.current = false; // reset tracking so it restarts after login
                setAuthenticatedUser(user);
                navigate("/dashboard");
              }}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            authenticatedUser ? (
              authenticatedUser.role === "P" ? (
                <TaskApprovalTable />
              ) : (
                <TaskBoard />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      {authenticatedUser && showTimeoutModal && (
        <SessionTimeoutModal
          onConfirm={handleRemainLoggedIn}
          onTimeout={handleLogout}
        />
      )}
    </>
  );
};

const App = () => {
  return (
    <Router basename="/tb">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
