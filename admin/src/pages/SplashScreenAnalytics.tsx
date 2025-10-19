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
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Splash Screen Analytics</h1>
        <p className="text-gray-600 mt-2">View all splash screens and their performance metrics</p>
      </div>

      {/* Splash Screens List */}
      <div className="space-y-6">
        {splashScreens.map((screen) => (
          <div key={screen.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{screen.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      screen.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {screen.isActive ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{screen.description}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedScreen(screen);
                    setShowImageModal(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="View full image"
                >
                  <FiMaximize2 size={20} style={{ color: '#ff93a3' }} />
                </button>
              </div>

              {/* Timeline Info */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiCalendar size={16} />
                  <span>Created: {formatDate(screen.createdAt)}</span>
                </div>
                {screen.replacedAt && (
                  <div className="flex items-center gap-2">
                    <FiCalendar size={16} />
                    <span>Replaced: {formatDate(screen.replacedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6 bg-gray-50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatBox icon={FiEye} label="Impressions" value={screen.impressions.toLocaleString()} />
              <StatBox icon={FiMousePointer} label="Clicks" value={screen.clicks.toLocaleString()} />
              <StatBox icon={FiSkipForward} label="Skips" value={screen.skips.toLocaleString()} />
              <StatBox icon={FiTrendingUp} label="CTR" value={`${screen.ctr}%`} />
              <StatBox icon={FiTrendingUp} label="Skip Rate" value={`${screen.skipRate}%`} />
              <StatBox icon={FiTrendingUp} label="Conversion" value={`${screen.conversionRate}%`} />
            </div>

            {/* Detailed Metrics */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unique Users Shown</p>
                <p className="text-2xl font-bold text-gray-900">{screen.uniqueUsersShown.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Unique Users Clicked</p>
                <p className="text-2xl font-bold text-gray-900">{screen.uniqueUsersClicked.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Associated Orders</p>
                <p className="text-2xl font-bold text-gray-900">{screen.associatedOrders.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Associated Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${parseFloat(screen.associatedRevenue).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${parseFloat(screen.averageOrderValue).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg View Time</p>
                <p className="text-2xl font-bold text-gray-900">{parseFloat(screen.averageViewTime).toFixed(1)}s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Display Duration</p>
                <p className="text-2xl font-bold text-gray-900">{screen.displayDuration}s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Activity</p>
                <p className="text-sm font-semibold text-gray-900">
                  {screen.lastClickAt ? formatDate(screen.lastClickAt) : 'No activity'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <FiX size={32} />
          </button>
          <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center max-h-[85vh] max-w-[95vw]">
            <img
              src={selectedScreen.imageUrl}
              alt={selectedScreen.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreenAnalytics;

