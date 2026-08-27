import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";

import Login from "./auth/Login.jsx";
import ChangePassword from "./auth/ChangePassword.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";

import "./global.css";

function ProtectedApp() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />

        <div className="loading-text">Loading HSGQ Cloud...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // ENFORCE CHANGE PASSWORD:
  // User with mustChangePassword = true CANNOT enter dashboard or main menu.
  if (profile?.mustChangePassword === true) {
    return <ChangePassword />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ProtectedApp />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
