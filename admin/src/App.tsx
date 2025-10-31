import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SplashScreenManager from './pages/SplashScreenManager';
import SplashScreenAnalytics from './pages/SplashScreenAnalytics';
import CarouselManager from './pages/CarouselManager';
import CarouselAnalytics from './pages/CarouselAnalytics';
import MenuItemsManager from './pages/MenuItemsManager';
import StoresManager from './pages/StoresManager';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AIPromotionsReview from './pages/AIPromotionsReview';
import PersonalizationAnalytics from './pages/PersonalizationAnalytics';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/splash-screen" element={<SplashScreenManager />} />
            <Route path="/splash-screen-analytics" element={<SplashScreenAnalytics />} />
            <Route path="/carousel" element={<CarouselManager />} />
            <Route path="/carousel-analytics" element={<CarouselAnalytics />} />
            <Route path="/menu-items" element={<MenuItemsManager />} />
            <Route path="/stores" element={<StoresManager />} />
            <Route path="/ai-promotions" element={<AIPromotionsReview />} />
            <Route path="/analytics" element={<PersonalizationAnalytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#000',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              padding: '16px 24px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;

