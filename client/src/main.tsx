import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppContent } from './App';
import { QrVerifyPage } from './components/common/QrVerifyPage';
import { MobileUploadPage } from './components/common/MobileUploadPage';
import './index.css';

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/verify' ? (
      <QrVerifyPage />
    ) : path === '/mobile-upload' ? (
      <MobileUploadPage />
    ) : (
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);
