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
  FunnelChart,
  Funnel,
  Cell,
  LabelList,
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
  FiSkipForward,
  FiCheckCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

/**
 * Enterprise-level Splash Screen Analytics Dashboard
 *
 * Features:
 * - Comprehensive metrics (5 event types: impression, click, skip, complete, order)
 * - Real-time data from backend aggregates
 * - Date range filtering with custom date pickers
 * - Session-based metrics
 * - CSV export functionality
 * - Per-splash deep dive analytics
 * - Advanced visualizations (CTR trends, completion rate, revenue, engagement funnel)
 * - Skip rate analysis
 * - View time tracking
 */

interface SplashScreenAnalytics {
  splashId: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  durationSeconds: number;
  isActive: boolean;
  impressions: number;
  uniqueUsersShown: number;
  uniqueUsersClicked: number;
  clicks: number;
  skips: number;
  completions: number;
  associatedOrders: number;
  associatedRevenue: string;
  ctr: string;
  skipRate: string;
  completionRate: string;
  conversionRate: string;
  avgOrderValue: string;
  avgViewTime: string;
  dailyData: DailyData[];
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  skips: number;
  completions: number;
  ctr: string;
  skipRate: string;
  completionRate: string;
  orders: number;
  revenue: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface SplashScreen {
  splashId: string;
  title: string;
  subtitle: string;
  imageAsset: {
    url: string;
  };
  isActive: boolean;
}

const SplashScreenAnalytics = () => {
  const [splashScreens, setSplashScreens] = useState<SplashScreen[]>([]);
  const [selectedSplashId, setSelectedSplashId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SplashScreenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchSplashScreens();
  }, []);

  useEffect(() => {
    if (selectedSplashId) {
      fetchSplashAnalytics(selectedSplashId);
    }
  }, [selectedSplashId, startDate, endDate]);

  const fetchSplashScreens = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE}/splash-screen?skip=0&take=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch splash screens');
      const data = await response.json();
      setSplashScreens(data.data || []);

      if (data.data && data.data.length > 0) {
        setSelectedSplashId(data.data[0].splashId);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load splash screens');
    } finally {
      setLoading(false);
    }
  };

  const fetchSplashAnalytics = async (splashId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const url = `${API_BASE}/splash-screen/analytics?splashId=${splashId}&startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();

      // Transform the data to match our interface
      const selectedScreen = splashScreens.find(s => s.splashId === splashId);
      const transformedData: SplashScreenAnalytics = {
        splashId: splashId,
        title: selectedScreen?.title || 'Unknown',
        subtitle: selectedScreen?.subtitle || '',
        imageUrl: selectedScreen?.imageAsset?.url || '',
        durationSeconds: 3,
        isActive: selectedScreen?.isActive || false,
        impressions: data.summary?.impressions || 0,
        uniqueUsersShown: data.summary?.uniqueUsers || 0,
        uniqueUsersClicked: data.summary?.uniqueUsersClicked || 0,
        clicks: data.summary?.clicks || 0,
        skips: data.summary?.skips || 0,
        completions: data.summary?.completions || 0,
        associatedOrders: data.summary?.orders || 0,
        associatedRevenue: data.summary?.revenue || '0.00',
        ctr: data.summary?.ctr || '0.00',
        skipRate: data.summary?.skipRate || '0.00',
        completionRate: ((data.summary?.completions || 0) / (data.summary?.impressions || 1) * 100).toFixed(2),
        conversionRate: data.summary?.conversionRate || '0.00',
        avgOrderValue: data.summary?.avgOrderValue || '0.00',
        avgViewTime: data.summary?.avgViewTime || '0.0',
        dailyData: (data.daily || []).map((day: any) => ({
          date: day.date,
          impressions: day.impressions || 0,
          clicks: day.clicks || 0,
          skips: day.skips || 0,
          completions: day.completions || 0,
          ctr: day.ctr || '0.00',
          skipRate: day.skipRate || '0.00',
          completionRate: ((day.completions || 0) / (day.impressions || 1) * 100).toFixed(2),
          orders: day.orders || 0,
          revenue: day.revenue || '0.00',
        })),
      };

      setAnalytics(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load analytics');
    }
  };

  // Quick date range handlers
  const setDateRangeToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const setDateRangeYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
  };

  const setDateRangeLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setDateRangeLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Date validation handlers
  const handleStartDateChange = (newStartDate: string) => {
    if (newStartDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }
    setStartDate(newStartDate);
  };

  const handleEndDateChange = (newEndDate: string) => {
    if (newEndDate < startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    setEndDate(newEndDate);
  };

  // Refresh analytics data
  const handleRefresh = async () => {
    if (!selectedSplashId) {
      toast.error('Please select a splash screen first');
      return;
    }

    try {
      setRefreshing(true);
      toast.loading('Refreshing analytics...', { id: 'refresh' });

      // Fetch latest analytics data
      await fetchSplashAnalytics(selectedSplashId);

      toast.success('Analytics refreshed successfully!', { id: 'refresh' });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Failed to refresh analytics', { id: 'refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  const exportToCSV = () => {
    if (!analytics) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = ['Date', 'Impressions', 'Clicks', 'Skips', 'Completions', 'CTR (%)', 'Skip Rate (%)', 'Completion Rate (%)', 'Orders', 'Revenue ($)'];
      const rows = analytics.dailyData.map((day) => [
        day.date,
        day.impressions,
        day.clicks,
        day.skips,
        day.completions,
        day.ctr,
        day.skipRate,
        day.completionRate,
        day.orders,
        day.revenue,
      ]);

      rows.push([]);
      rows.push(['Summary']);
      rows.push(['Total Impressions', analytics.impressions]);
      rows.push(['Total Clicks', analytics.clicks]);
      rows.push(['Total Skips', analytics.skips]);
      rows.push(['Total Completions', analytics.completions]);
      rows.push(['Overall CTR (%)', analytics.ctr]);
      rows.push(['Overall Skip Rate (%)', analytics.skipRate]);
      rows.push(['Overall Completion Rate (%)', analytics.completionRate]);
      rows.push(['Total Orders', analytics.associatedOrders]);
      rows.push(['Total Revenue ($)', analytics.associatedRevenue]);
      rows.push(['Avg Order Value ($)', analytics.avgOrderValue]);
      rows.push(['Avg View Time (s)', analytics.avgViewTime]);
      rows.push(['Unique Users Shown', analytics.uniqueUsersShown]);
      rows.push(['Unique Users Clicked', analytics.uniqueUsersClicked]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `splash-analytics-${analytics.splashId}-${startDate}-to-${endDate}.csv`);
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
        title: 'Avg View Time',
        value: `${parseFloat(analytics.avgViewTime).toFixed(1)}s`,
        icon: <FiClock className="w-6 h-6" />,
        color: 'bg-indigo-500',
      },
    ];
  };

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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <FiActivity className="text-pink-500" />
              Splash Screen Analytics
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Enterprise-level analytics for splash screen performance and engagement
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || !selectedSplashId}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
              refreshing || !selectedSplashId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white hover:shadow-xl hover:opacity-90'
            }`}
            style={refreshing || !selectedSplashId ? {} : { backgroundColor: '#ff93a3' }}
          >
            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">

      {/* Splash Screen Selector */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Splash Screen
        </label>
        <select
          value={selectedSplashId || ''}
          onChange={(e) => setSelectedSplashId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 font-medium"
        >
          {splashScreens.map((screen) => (
            <option key={screen.splashId} value={screen.splashId}>
              {screen.title} {screen.isActive ? '(Active)' : '(Inactive)'}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <FiCalendar className="text-pink-500 w-5 h-5" />
            <span className="text-sm font-semibold text-gray-700">Date Range</span>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium shadow-sm"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Quick Date Range Buttons */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={setDateRangeToday}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm shadow-sm"
          >
            Today
          </button>
          <button
            onClick={setDateRangeYesterday}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all font-medium text-sm shadow-sm"
          >
            Yesterday
          </button>
          <button
            onClick={setDateRangeLast7Days}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium text-sm shadow-sm"
          >
            Last 7 Days
          </button>
          <button
            onClick={setDateRangeLast30Days}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all font-medium text-sm shadow-sm"
          >
            Last 30 Days
          </button>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      {!analytics ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <FiActivity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Select a splash screen to view analytics</p>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {getMetricCards().map((metric, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                  <div className={`${metric.color} p-4 rounded-xl text-white`}>
                    {metric.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* CTR Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiTarget className="text-purple-500" />
                Click-Through Rate Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [`${parseFloat(value).toFixed(2)}%`, 'CTR']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ctr"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name="CTR (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Skip Rate & Completion Rate Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiSkipForward className="text-orange-500" />
                Skip Rate vs Completion Rate
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [`${parseFloat(value).toFixed(2)}%`]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="skipRate"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 4 }}
                    name="Skip Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Completion Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiDollarSign className="text-pink-500" />
                Revenue Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.dailyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ec4899"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Engagement Funnel */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiZap className="text-blue-500" />
                Engagement Funnel
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Impressions', value: analytics.impressions, fill: '#3b82f6' },
                    { name: 'Clicks', value: analytics.clicks, fill: '#10b981' },
                    { name: 'Completions', value: analytics.completions, fill: '#8b5cf6' },
                    { name: 'Orders', value: analytics.associatedOrders, fill: '#ec4899' },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [value.toLocaleString(), 'Count']}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {[
                      { name: 'Impressions', value: analytics.impressions, fill: '#3b82f6' },
                      { name: 'Clicks', value: analytics.clicks, fill: '#10b981' },
                      { name: 'Completions', value: analytics.completions, fill: '#8b5cf6' },
                      { name: 'Orders', value: analytics.associatedOrders, fill: '#ec4899' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiActivity className="text-indigo-500" />
              Detailed Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Unique Users Shown</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.uniqueUsersShown.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700 mb-1">Unique Users Clicked</p>
                <p className="text-2xl font-bold text-green-900">{analytics.uniqueUsersClicked.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-700 mb-1">Skip Rate</p>
                <p className="text-2xl font-bold text-orange-900">{analytics.skipRate}%</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.completionRate}%</p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
                <p className="text-sm font-medium text-pink-700 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-pink-900">{analytics.conversionRate}%</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm font-medium text-indigo-700 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-indigo-900">${parseFloat(analytics.avgOrderValue).toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-sm font-medium text-teal-700 mb-1">Total Skips</p>
                <p className="text-2xl font-bold text-teal-900">{analytics.skips.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <p className="text-sm font-medium text-cyan-700 mb-1">Total Completions</p>
                <p className="text-2xl font-bold text-cyan-900">{analytics.completions.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default SplashScreenAnalytics;

