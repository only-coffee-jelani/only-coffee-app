import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiImage, FiMenu, FiMapPin, FiBarChart2, FiSettings, FiLogOut, FiSliders, FiZap, FiUsers, FiTarget
} from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/splash-screen', label: 'Splash Screen', icon: FiImage },
    { path: '/splash-screen-analytics', label: 'Splash Analytics', icon: FiBarChart2 },
    { path: '/carousel', label: 'Carousel', icon: FiSliders },
    { path: '/carousel-analytics', label: 'Carousel Analytics', icon: FiBarChart2 },
    { path: '/carousel-ab-testing', label: 'Carousel A/B Testing', icon: FiTarget },
    { path: '/menu-items', label: 'Menu Items', icon: FiMenu },
    { path: '/stores', label: 'Stores', icon: FiMapPin },
    { path: '/users', label: 'Users & Analytics', icon: FiUsers },
    { path: '/ai-promotions', label: 'AI Promotions', icon: FiZap },
    { path: '/analytics', label: 'Personalization Analytics', icon: FiBarChart2 },
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold" style={{ color: '#ff93a3' }}>
          ☕ Only Coffee
        </h1>
        <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-pink-50 text-pink-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={isActive(item.path) ? { color: '#ff93a3' } : {}}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

