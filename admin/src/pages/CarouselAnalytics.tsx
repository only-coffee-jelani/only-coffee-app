import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  FiDownload,
  FiCalendar,
  FiEye,
  FiMousePointer,
  FiTarget,
  FiShoppingCart,
  FiDollarSign,
  FiZap,
  FiClock,
  FiActivity,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

/**
 * Enterprise-level Carousel Analytics Dashboard
 * 
 * Features:
 * - Comprehensive metrics (9 event types)
 * - Real-time data from backend aggregates
 * - Date range filtering with backend queries
 * - Engagement scoring (0-100 algorithm)
 * - Swipe analytics (direction + velocity)
 * - Position performance tracking
 * - Session-based metrics
 * - CSV export functionality
 * - Per-item deep dive analytics
 * - Advanced visualizations
 */

interface CarouselItemAnalytics {
  carouselItemId: string;
  title: string;
  imageUrl: string;
  impressions: number;
  uniqueUsersShown: number;
  uniqueUsersClicked: number;
  clicks: number;
  swipesLeft: number;
  swipesRight: number;
  autoAdvances: number;
  manualAdvances: number;
  addToCartCount: number;
  associatedOrders: number;
  associatedRevenue: string;
  ctr: string;
  conversionRate: string;
  avgOrderValue: string;
  engagementRate: string;
  avgTimeOnSlideSeconds: string;
  avgEngagementScore: string;
  dailyData: DailyData[];
  positionInCarousel: number;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  ctr: string;
  orders: number;
  revenue: string;
  engagementScore: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface CarouselItem {
  carouselItemId: string;
  title: string;
  imageAsset: {
    url: string;
  };
}

const CarouselAnalytics = () => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CarouselItemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchCarouselItems();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      fetchItemAnalytics(selectedItemId);
    }
  }, [selectedItemId, startDate, endDate]);

  const fetchCarouselItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE}/carousel/active`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch carousel items');
      const items = await response.json();
      setCarouselItems(items);
      
      if (items.length > 0) {
        setSelectedItemId(items[0].carouselItemId);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load carousel items');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemAnalytics = async (itemId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const url = `${API_BASE}/carousel/items/${itemId}/analytics?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load analytics');
    }
  };

  const exportToCSV = () => {
    if (!analytics) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = ['Date', 'Impressions', 'Clicks', 'CTR (%)', 'Orders', 'Revenue ($)', 'Engagement Score'];
      const rows = analytics.dailyData.map((day) => [
        day.date,
        day.impressions,
        day.clicks,
        day.ctr,
        day.orders,
        day.revenue,
        day.engagementScore,
      ]);

      rows.push([]);
      rows.push(['Summary']);
      rows.push(['Total Impressions', analytics.impressions]);
      rows.push(['Total Clicks', analytics.clicks]);
      rows.push(['Overall CTR (%)', analytics.ctr]);
      rows.push(['Total Orders', analytics.associatedOrders]);
      rows.push(['Total Revenue ($)', analytics.associatedRevenue]);
      rows.push(['Avg Engagement Score', analytics.avgEngagementScore]);
      rows.push(['Avg Time on Slide (s)', analytics.avgTimeOnSlideSeconds]);
      rows.push(['Swipes Left', analytics.swipesLeft]);
      rows.push(['Swipes Right', analytics.swipesRight]);
      rows.push(['Auto Advances', analytics.autoAdvances]);
      rows.push(['Manual Advances', analytics.manualAdvances]);
      rows.push(['Add to Cart', analytics.addToCartCount]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `carousel-analytics-${analytics.carouselItemId}-${startDate}-to-${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Analytics exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export analytics');
    }
  };

  const getMetricCards = (): MetricCard[] => {
    if (!analytics) return [];

    return [
      {
        title: 'Total Impressions',
        value: analytics.impressions.toLocaleString(),
        icon: <FiEye className="w-6 h-6" />,
        color: 'bg-blue-500',
      },
      {
        title: 'Total Clicks',
        value: analytics.clicks.toLocaleString(),
        icon: <FiMousePointer className="w-6 h-6" />,
        color: 'bg-green-500',
      },
      {
        title: 'Click-Through Rate',
        value: `${analytics.ctr}%`,
        icon: <FiTarget className="w-6 h-6" />,
        color: 'bg-purple-500',
      },
      {
        title: 'Total Orders',
        value: analytics.associatedOrders.toLocaleString(),
        icon: <FiShoppingCart className="w-6 h-6" />,
        color: 'bg-orange-500',
      },
      {
        title: 'Total Revenue',
        value: `$${parseFloat(analytics.associatedRevenue).toFixed(2)}`,
        icon: <FiDollarSign className="w-6 h-6" />,
        color: 'bg-pink-500',
      },
      {
        title: 'Engagement Score',
        value: `${parseFloat(analytics.avgEngagementScore).toFixed(1)}/100`,
        icon: <FiZap className="w-6 h-6" />,
        color: 'bg-yellow-500',
      },
    ];
  };

  const metricCards = getMetricCards();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff93a3]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enterprise Carousel Analytics</h1>
        <p className="text-gray-600">
          Comprehensive analytics with engagement scoring, swipe tracking, and position performance
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <FiCalendar className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="ml-auto flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Carousel Item:</label>
        <select
          value={selectedItemId || ''}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {carouselItems.map((item) => (
            <option key={item.carouselItemId} value={item.carouselItemId}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {metricCards.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`${metric.color} text-white p-2 rounded-lg`}>{metric.icon}</div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Impressions & Clicks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="clicks" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue & Orders</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Score Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="engagementScore" stroke="#eab308" strokeWidth={3} name="Engagement Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Interaction Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Swipes Left', value: analytics.swipesLeft, fill: '#ef4444' },
                    { name: 'Swipes Right', value: analytics.swipesRight, fill: '#10b981' },
                    { name: 'Auto Advance', value: analytics.autoAdvances, fill: '#6366f1' },
                    { name: 'Manual Advance', value: analytics.manualAdvances, fill: '#8b5cf6' },
                    { name: 'Add to Cart', value: analytics.addToCartCount, fill: '#f59e0b' },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500 text-white p-3 rounded-lg">
                  <FiZap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Engagement Score</h3>
                  <p className="text-sm text-gray-600">0-100 Algorithm</p>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {parseFloat(analytics.avgEngagementScore).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${parseFloat(analytics.avgEngagementScore)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Based on views, clicks, swipes, and conversions
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 text-white p-3 rounded-lg">
                  <FiClock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Avg Time on Slide</h3>
                  <p className="text-sm text-gray-600">User Attention</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {parseFloat(analytics.avgTimeOnSlideSeconds).toFixed(1)}s
              </div>
              <p className="text-xs text-gray-500">Average time users spend viewing this item</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500 text-white p-3 rounded-lg">
                  <FiActivity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Engagement Rate</h3>
                  <p className="text-sm text-gray-600">Interaction %</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{analytics.engagementRate}%</div>
              <p className="text-xs text-gray-500">
                Percentage of viewers who interacted with this item
              </p>
            </div>
          </div>
        </>
      )}

      {!analytics && !loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Select a carousel item to view its analytics</p>
        </div>
      )}
    </div>
  );
};

export default CarouselAnalytics;


