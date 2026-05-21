import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RootErrorBoundary } from './components/RootErrorBoundary';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
