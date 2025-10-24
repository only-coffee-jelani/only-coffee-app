import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiDownload, FiCalendar, FiTrendingUp, FiEye, FiMousePointer, FiTarget } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../config';

interface CarouselAnalyticsData {
  id: string;
  title: string;
  viewCount: number;
  clickCount: number;
  conversionCount: number;
  clickThroughRate: number;
  conversionRate: number;
  createdAt: Date;
  lastViewedAt: Date | null;
  lastClickedAt: Date | null;
  isActive: boolean;
}

interface ChartData {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
}

const CarouselAnalytics = () => {
  const { isAuthenticated } = useAuthStore();
  const [carouselData, setCarouselData] = useState<CarouselAnalyticsData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [selectedImage, setSelectedImage] = useState<CarouselAnalyticsData | null>(null);

  useEffect(() => {
    fetchCarouselAnalytics();
  }, []);

  const fetchCarouselAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        toast.error('Not authenticated. Please login first.');
        return;
      }

      const response = await fetch(`${API_BASE}/carousel/analytics/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch carousel analytics');

      const data = await response.json();
      setCarouselData(data || []);

      // Generate chart data based on date range
      generateChartData(data || []);
    } catch (error) {
      console.error('Error fetching carousel analytics:', error);
      toast.error('Failed to load carousel analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (images: CarouselAnalyticsData[]) => {
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    const data: ChartData[] = [];

    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Distribute total analytics evenly across days
      const totalViews = images.reduce((sum, img) => sum + img.viewCount, 0);
      const totalClicks = images.reduce((sum, img) => sum + img.clickCount, 0);
      const totalConversions = images.reduce((sum, img) => sum + img.conversionCount, 0);

      data.push({
        date: dateStr,
        views: Math.floor(totalViews / days),
        clicks: Math.floor(totalClicks / days),
        conversions: Math.floor(totalConversions / days),
      });
    }

    setChartData(data);
  };

  const totalStats = {
    views: carouselData.reduce((sum, img) => sum + img.viewCount, 0),
    clicks: carouselData.reduce((sum, img) => sum + img.clickCount, 0),
    conversions: carouselData.reduce((sum, img) => sum + img.conversionCount, 0),
  };

  const avgCTR = carouselData.length > 0
    ? (carouselData.reduce((sum, img) => sum + img.clickThroughRate, 0) / carouselData.length).toFixed(2)
    : 0;

  const topPerformers = [...carouselData]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const ctrData = carouselData.map((img) => ({
    name: img.title.substring(0, 15),
    ctr: parseFloat(img.clickThroughRate.toFixed(2)),
  }));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading carousel analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Carousel Analytics</h1>
          <p className="text-gray-600 mt-2 text-lg">Track performance of your promotional carousel images</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.views.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiEye size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.clicks.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiMousePointer size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Conversions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.conversions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiTarget size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg CTR</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {avgCTR}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiTrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views, Clicks, Conversions Over Time */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #ff93a3' }} />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CTR by Image */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Click-Through Rate by Image</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #ff93a3' }} />
                <Bar dataKey="ctr" fill="#ff93a3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Images</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-pink-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Views</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Clicks</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">CTR</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Conversions</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((image) => (
                  <tr key={image.id} className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{image.title}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{image.viewCount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-gray-700">{image.clickCount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {image.clickThroughRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{image.conversionCount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {image.conversionRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Images Detailed Stats */}
        <div className="bg-white rounded-2xl p-6 border-2 border-pink-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Carousel Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carouselData.map((image) => (
              <div
                key={image.id}
                className="border-2 border-pink-100 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <h3 className="font-bold text-gray-900 mb-3">{image.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-semibold text-gray-900">{image.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clicks:</span>
                    <span className="font-semibold text-gray-900">{image.clickCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversions:</span>
                    <span className="font-semibold text-gray-900">{image.conversionCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-pink-100">
                    <span className="text-gray-600">CTR:</span>
                    <span className="font-semibold text-blue-600">{image.clickThroughRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conv. Rate:</span>
                    <span className="font-semibold text-green-600">{image.conversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${image.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {image.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselAnalytics;

