import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthProvider';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { UIProvider } from './contexts/UIContext';

console.log("APP STARTING...");

window.onerror = function(message, source, lineno, colno, error) {
  console.error("GLOBAL ERROR:", { message, source, lineno, colno, error });
  fetch('/api/health?msg=' + encodeURIComponent(JSON.stringify({message, stack: error?.stack}))).catch(()=>console.log);
};

window.onunhandledrejection = function(event) {
  event.preventDefault();
  console.warn("UNHANDLED PROMISE REJECTION RAW:", event.reason);
  fetch('/api/health?msg=' + encodeURIComponent(JSON.stringify({reason: event.reason ? event.reason.toString() : 'Unknown'}))).catch(()=>console.log);
};

const originalConsoleError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('Cannot convert undefined') || args[0].includes('ErrorBoundary'))) {
     const safeArgs = args.map(a => {
       if (a instanceof Error) {
         return JSON.stringify({ message: a.message, stack: a.stack });
       }
       return typeof a === 'object' ? JSON.stringify(a) : String(a);
     });
     fetch('/api/health?log=' + encodeURIComponent(safeArgs.join(' '))).catch(()=>console.log);
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <UIProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </UIProvider>
    </ErrorBoundary>
  </StrictMode>,
);
