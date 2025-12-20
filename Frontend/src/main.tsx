import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

// Polyfill for simple-peer
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  </BrowserRouter>
);
