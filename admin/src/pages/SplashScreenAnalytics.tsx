import React, { useState, useEffect } from 'react';
import { FiEye, FiMousePointer, FiSkipForward, FiTrendingUp, FiCalendar, FiUser, FiMaximize2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SplashScreen {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  displayDuration: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
  skips: number;
  ctr: string;
  skipRate: string;
  associatedOrders: number;
  associatedRevenue: string;
  conversionRate: string;
  averageOrderValue: string;
  uniqueUsersShown: number;
  uniqueUsersClicked: number;
  averageViewTime: string;
  lastImpressionAt: string | null;
  lastClickAt: string | null;
  createdAt: string;
  replacedAt: string | null;
  createdById: string | null;
}

const SplashScreenAnalytics = () => {
  const [splashScreens, setSplashScreens] = useState<SplashScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreen, setSelectedScreen] = useState<SplashScreen | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadSplashScreens();
  }, []);

  const loadSplashScreens = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/splash-screen?skip=0&take=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setSplashScreens(data.data.sort((a: SplashScreen, b: SplashScreen) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      toast.error('Failed to load splash screens');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatBox = ({ icon: Icon, label, value, color = '#ff93a3' }: any) => (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-200 flex items-center gap-4 hover:shadow-lg transition-all">
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Loading splash screens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 p-8">
      {/* Header */}
      <div className="mb-12 max-w-6xl mx-auto">
        <div className="inline-block mb-4">
          <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">Analytics Dashboard</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
          Splash Screen Analytics
        </h1>
        <p className="text-gray-600 text-lg">Track performance and engagement metrics for your splash screens</p>
      </div>

      {/* Splash Screens List */}
      <div className="space-y-8 max-w-6xl mx-auto">
        {splashScreens.map((screen) => (
          <div
            key={screen.id}
            className="bg-white rounded-3xl border-2 border-pink-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-pink-300"
          >
            {/* Header with Image Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
              {/* Image Preview */}
              <div className="md:col-span-1">
                <button
                  onClick={() => {
                    setSelectedScreen(screen);
                    setShowImageModal(true);
                  }}
                  className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={screen.imageUrl}
                    alt={screen.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <FiMaximize2 size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>

              {/* Info Section */}
              <div className="md:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{screen.title}</h2>
                      <p className="text-gray-600 text-base leading-relaxed">{screen.description}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ml-4 ${
                      screen.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {screen.isActive ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </div>

                  {/* Timeline Info */}
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <FiCalendar size={16} className="text-pink-500" />
                      <span><strong>Created:</strong> {formatDate(screen.createdAt)}</span>
                    </div>
                    {screen.replacedAt && (
                      <div className="flex items-center gap-2">
                        <FiCalendar size={16} className="text-pink-500" />
                        <span><strong>Replaced:</strong> {formatDate(screen.replacedAt)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FiUser size={16} className="text-pink-500" />
                      <span><strong>Duration:</strong> {screen.displayDuration}s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="px-8 py-6 bg-gradient-to-r from-pink-50 to-orange-50 border-t-2 border-pink-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatBox icon={FiEye} label="Impressions" value={screen.impressions.toLocaleString()} />
                <StatBox icon={FiMousePointer} label="Clicks" value={screen.clicks.toLocaleString()} />
                <StatBox icon={FiSkipForward} label="Skips" value={screen.skips.toLocaleString()} />
                <StatBox icon={FiTrendingUp} label="CTR" value={`${screen.ctr}%`} color="#ff6b6b" />
                <StatBox icon={FiTrendingUp} label="Skip Rate" value={`${screen.skipRate}%`} color="#ffa94d" />
                <StatBox icon={FiTrendingUp} label="Conversion" value={`${screen.conversionRate}%`} color="#51cf66" />
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                <p className="text-xs text-blue-700 uppercase tracking-wide font-bold mb-2">Unique Users Shown</p>
                <p className="text-3xl font-bold text-blue-900">{screen.uniqueUsersShown.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                <p className="text-xs text-purple-700 uppercase tracking-wide font-bold mb-2">Unique Users Clicked</p>
                <p className="text-3xl font-bold text-purple-900">{screen.uniqueUsersClicked.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
                <p className="text-xs text-green-700 uppercase tracking-wide font-bold mb-2">Associated Orders</p>
                <p className="text-3xl font-bold text-green-900">{screen.associatedOrders.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200">
                <p className="text-xs text-pink-700 uppercase tracking-wide font-bold mb-2">Associated Revenue</p>
                <p className="text-3xl font-bold text-pink-900">${parseFloat(screen.associatedRevenue).toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
                <p className="text-xs text-orange-700 uppercase tracking-wide font-bold mb-2">Avg Order Value</p>
                <p className="text-3xl font-bold text-orange-900">${parseFloat(screen.averageOrderValue).toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200">
                <p className="text-xs text-indigo-700 uppercase tracking-wide font-bold mb-2">Avg View Time</p>
                <p className="text-3xl font-bold text-indigo-900">{parseFloat(screen.averageViewTime).toFixed(1)}s</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedScreen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
          >
            <FiX size={32} />
          </button>
          <div className="relative bg-black rounded-3xl overflow-hidden flex items-center justify-center max-h-[85vh] max-w-[95vw] shadow-2xl">
            <img
              src={selectedScreen.imageUrl}
              alt={selectedScreen.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <p className="text-white text-center mt-6 text-lg font-semibold">{selectedScreen.title}</p>
        </div>
      )}
    </div>
  );
};

export default SplashScreenAnalytics;

