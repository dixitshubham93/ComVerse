    import React from 'react';
    import { createRoot } from "react-dom/client";
    import App from "./App.tsx";
    import "./index.css";
    import { AuthProvider } from "./contexts/AuthContext";
    import { BrowserRouter } from "react-router-dom";
    import { Toaster } from "sonner";
    import { Buffer } from 'buffer';
    import process from 'process';
    
    // Polyfill for simple-peer
    (window as any).global = window;
    (window as any).Buffer = Buffer;
    (window as any).process = process;
    
    createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  </BrowserRouter>
);
