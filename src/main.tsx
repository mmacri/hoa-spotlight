import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Robust startup logging
console.log('[Startup] href:', window.location.href, 'pathname:', window.location.pathname, 'BASE_URL:', import.meta.env.BASE_URL);

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[GlobalError]', event.message, event.error, {
    filename: (event as any).filename,
    lineno: (event as any).lineno,
    colno: (event as any).colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason);
});

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('#root element not found');
  }
  createRoot(rootEl).render(<App />);
  console.log('[Startup] React app mounted successfully');
} catch (e) {
  console.error('[Startup] Failed to mount React app', e);
}

