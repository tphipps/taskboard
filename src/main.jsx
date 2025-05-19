// main.jsx (App logic using AuthProvider)
import './index.css';

import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";
import LoginBox from "./components/LoginBox";
import TaskBoard from "./components/TaskBoard";
import TaskApprovalTable from "./components/TaskApprovalTable";
import { AuthProvider, useAuth } from "./context/AuthContext";

const AppRoutes = () => {
  const { authenticatedUser, setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (user) => {
    setAuthenticatedUser(user);
    navigate("/dashboard");
  };

  return (
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
      <Route path="/login" element={<LoginBox onLogin={handleLogin} />} />
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
