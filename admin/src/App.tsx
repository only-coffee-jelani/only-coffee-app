import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SplashScreenManager from './pages/SplashScreenManager';
import SplashScreenAnalytics from './pages/SplashScreenAnalytics';
import CarouselManager from './pages/CarouselManager';
import MenuItemsManager from './pages/MenuItemsManager';
import ImagesManager from './pages/ImagesManager';
import StoresManager from './pages/StoresManager';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
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
            <Route path="/menu-items" element={<MenuItemsManager />} />
            <Route path="/images" element={<ImagesManager />} />
            <Route path="/stores" element={<StoresManager />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;

