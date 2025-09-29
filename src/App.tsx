import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Homepage } from "./pages/Homepage";
import { SearchPage } from "./pages/SearchPage";
import { HOAProfile } from "./pages/HOAProfile";
import { CommunityPortal } from "./pages/CommunityPortal";
import { CommunityDashboard } from "./pages/CommunityDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  console.log('[Startup] App initialized - basename:', base, 'pathname:', window.location.pathname, 'href:', window.location.href);
  
  // Add unhandled error logging for GitHub Pages debugging
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[UnhandledRejection]', {
        reason: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    };

    const handleError = (event: ErrorEvent) => {
      console.error('[GlobalError]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={base}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/hoa/:slug" element={<HOAProfile />} />
              <Route path="/community/:slug" element={<CommunityPortal />} />
              <Route path="/community/:slug/dashboard" element={<CommunityDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;