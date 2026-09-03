import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";

import Login from "./auth/Login.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

import "./global.css";

function ProtectedApp() {
  const { user, loading } = useAuth();

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

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ProtectedApp />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
