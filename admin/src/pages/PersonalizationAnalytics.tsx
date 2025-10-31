import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiZap,
  FiBell,
  FiRefreshCw,
  FiLoader,
  FiArrowUp,
  FiArrowDown,
  FiCalendar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

interface KPIData {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  churnRate: number;
  trends: {
    users: number;
    revenue: number;
    conversion: number;
    churn: number;
  };
}

interface SegmentData {
  segment: string;
  count: number;
  percentage: number;
  avgRevenue: number;
  churnRisk: number;
  engagementScore: number;
}

interface PromotionMetrics {
  totalPromotions: number;
  activePromotions: number;
  totalRedemptions: number;
  redemptionRate: number;
  revenueGenerated: number;
  topPerformers: Array<{
    id: string;
    title: string;
    redemptions: number;
    revenue: number;
    conversionRate: number;
  }>;
}

interface BanditMetrics {
  totalArms: number;
  totalPulls: number;
  totalRewards: number;
  avgConversionRate: number;
  topArms: Array<{
    armId: string;
    name: string;
    pulls: number;
    rewards: number;
    conversionRate: number;
  }>;
}

interface NotificationMetrics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  byChannel: {
    push: { sent: number; opened: number };
    email: { sent: number; opened: number };
    sms: { sent: number; clicked: number };
  };
}

interface RecommendationMetrics {
  totalRecommendations: number;
  clicked: number;
  purchased: number;
  clickRate: number;
  purchaseRate: number;
  revenueGenerated: number;
}

const PersonalizationAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Data states
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [segmentData, setSegmentData] = useState<SegmentData[]>([]);
  const [promotionMetrics, setPromotionMetrics] = useState<PromotionMetrics | null>(null);
  const [banditMetrics, setBanditMetrics] = useState<BanditMetrics | null>(null);
  const [notificationMetrics, setNotificationMetrics] = useState<NotificationMetrics | null>(null);
  const [recommendationMetrics, setRecommendationMetrics] = useState<RecommendationMetrics | null>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIData(),
        fetchSegmentData(),
        fetchPromotionMetrics(),
        fetchBanditMetrics(),
        fetchNotificationMetrics(),
        fetchRecommendationMetrics(),
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/analytics/kpis?dateRange=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch KPI data');
      const data = await response.json();
      setKpiData(data.kpis);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const fetchSegmentData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/segmentation/distribution`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch segment data');
      const data = await response.json();
      setSegmentData(data.distribution || []);
    } catch (error) {
      console.error('Error fetching segment data:', error);
    }
  };

  const fetchPromotionMetrics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/analytics/promotions?dateRange=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch promotion metrics');
      const data = await response.json();
      setPromotionMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching promotion metrics:', error);
    }
  };

  const fetchBanditMetrics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/contextual-bandit/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch bandit metrics');
      const data = await response.json();
      setBanditMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching bandit metrics:', error);
    }
  };

  const fetchNotificationMetrics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/analytics/notifications?dateRange=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notification metrics');
      const data = await response.json();
      setNotificationMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching notification metrics:', error);
    }
  };

  const fetchRecommendationMetrics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/analytics/recommendations?dateRange=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch recommendation metrics');
      const data = await response.json();
      setRecommendationMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching recommendation metrics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      champions: '#10b981',
      loyal_customers: '#3b82f6',
      potential_loyalists: '#8b5cf6',
      recent_customers: '#06b6d4',
      promising: '#14b8a6',
      needs_attention: '#f59e0b',
      about_to_sleep: '#f97316',
      at_risk: '#ef4444',
      cant_lose_them: '#dc2626',
      hibernating: '#9ca3af',
      lost: '#6b7280',
    };
    return colors[segment] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-pink-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personalization Analytics</h1>
            <p className="text-gray-600 mt-1">AI-driven insights and performance metrics</p>
          </div>
          <div className="flex gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
              style={{ backgroundColor: refreshing ? '#d1d5db' : '#ff93a3' }}
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiUsers className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{kpiData.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {kpiData.trends.users >= 0 ? (
                <>
                  <FiArrowUp className="text-green-500" />
                  <span className="text-green-600 font-medium">+{formatPercent(Math.abs(kpiData.trends.users))}</span>
                </>
              ) : (
                <>
                  <FiArrowDown className="text-red-500" />
                  <span className="text-red-600 font-medium">-{formatPercent(Math.abs(kpiData.trends.users))}</span>
                </>
              )}
              <span className="text-gray-500">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiDollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpiData.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {kpiData.trends.revenue >= 0 ? (
                <>
                  <FiArrowUp className="text-green-500" />
                  <span className="text-green-600 font-medium">+{formatPercent(Math.abs(kpiData.trends.revenue))}</span>
                </>
              ) : (
                <>
                  <FiArrowDown className="text-red-500" />
                  <span className="text-red-600 font-medium">-{formatPercent(Math.abs(kpiData.trends.revenue))}</span>
                </>
              )}
              <span className="text-gray-500">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiTarget className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercent(kpiData.conversionRate)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {kpiData.trends.conversion >= 0 ? (
                <>
                  <FiArrowUp className="text-green-500" />
                  <span className="text-green-600 font-medium">+{formatPercent(Math.abs(kpiData.trends.conversion))}</span>
                </>
              ) : (
                <>
                  <FiArrowDown className="text-red-500" />
                  <span className="text-red-600 font-medium">-{formatPercent(Math.abs(kpiData.trends.conversion))}</span>
                </>
              )}
              <span className="text-gray-500">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FiTrendingDown className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Churn Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercent(kpiData.churnRate)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {kpiData.trends.churn <= 0 ? (
                <>
                  <FiArrowDown className="text-green-500" />
                  <span className="text-green-600 font-medium">-{formatPercent(Math.abs(kpiData.trends.churn))}</span>
                </>
              ) : (
                <>
                  <FiArrowUp className="text-red-500" />
                  <span className="text-red-600 font-medium">+{formatPercent(Math.abs(kpiData.trends.churn))}</span>
                </>
              )}
              <span className="text-gray-500">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FiDollarSign className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpiData.avgOrderValue)}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Per transaction</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <FiUsers className="text-cyan-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{kpiData.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">All time</p>
          </div>
        </div>
      )}

      {/* User Segmentation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">User Segmentation</h2>
        <div className="space-y-3">
          {segmentData.map((segment) => (
            <div key={segment.segment} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {segment.segment.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {segment.count.toLocaleString()} users ({formatPercent(segment.percentage)})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${segment.percentage * 100}%`,
                      backgroundColor: getSegmentColor(segment.segment),
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Avg Revenue</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(segment.avgRevenue)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Churn Risk</p>
                  <p className="font-semibold" style={{ color: segment.churnRisk > 0.5 ? '#ef4444' : '#10b981' }}>
                    {formatPercent(segment.churnRisk)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Promotion Performance */}
        {promotionMetrics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiTarget className="text-pink-500" />
              Promotion Performance
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Active Promotions</p>
                <p className="text-2xl font-bold text-gray-900">{promotionMetrics.activePromotions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Redemptions</p>
                <p className="text-2xl font-bold text-gray-900">{promotionMetrics.totalRedemptions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Redemption Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(promotionMetrics.redemptionRate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue Generated</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(promotionMetrics.revenueGenerated)}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Top Performers</p>
              <div className="space-y-2">
                {promotionMetrics.topPerformers.slice(0, 3).map((promo, index) => (
                  <div key={promo.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 flex items-center gap-2">
                      <span className="text-pink-500 font-bold">#{index + 1}</span>
                      {promo.title}
                    </span>
                    <span className="font-semibold text-gray-700">{formatPercent(promo.conversionRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contextual Bandit Performance */}
        {banditMetrics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiZap className="text-purple-500" />
              Bandit Optimization
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Arms</p>
                <p className="text-2xl font-bold text-gray-900">{banditMetrics.totalArms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pulls</p>
                <p className="text-2xl font-bold text-gray-900">{banditMetrics.totalPulls.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(banditMetrics.avgConversionRate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold text-gray-900">{banditMetrics.totalRewards.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Top Performing Arms</p>
              <div className="space-y-2">
                {banditMetrics.topArms.slice(0, 3).map((arm, index) => (
                  <div key={arm.armId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 flex items-center gap-2">
                      <span className="text-purple-500 font-bold">#{index + 1}</span>
                      {arm.name}
                    </span>
                    <span className="font-semibold text-gray-700">{formatPercent(arm.conversionRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notification Performance */}
        {notificationMetrics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBell className="text-orange-500" />
              Notification Performance
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{notificationMetrics.totalSent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{notificationMetrics.delivered.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(notificationMetrics.openRate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(notificationMetrics.clickRate)}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">By Channel</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Push Notifications</span>
                  <span className="font-semibold text-gray-900">
                    {notificationMetrics.byChannel.push.sent.toLocaleString()} sent
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Email</span>
                  <span className="font-semibold text-gray-900">
                    {notificationMetrics.byChannel.email.sent.toLocaleString()} sent
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">SMS</span>
                  <span className="font-semibold text-gray-900">
                    {notificationMetrics.byChannel.sms.sent.toLocaleString()} sent
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Performance */}
        {recommendationMetrics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-blue-500" />
              Recommendation Engine
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Shown</p>
                <p className="text-2xl font-bold text-gray-900">{recommendationMetrics.totalRecommendations.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clicked</p>
                <p className="text-2xl font-bold text-gray-900">{recommendationMetrics.clicked.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(recommendationMetrics.clickRate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchase Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(recommendationMetrics.purchaseRate)}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Revenue Generated</p>
                <p className="text-2xl font-bold" style={{ color: '#ff93a3' }}>
                  {formatCurrency(recommendationMetrics.revenueGenerated)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">ML Models Status</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-900 font-medium">All Systems Operational</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Segmentation, Churn, Recommendations, Bandit</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Feature Store</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-900 font-medium">Healthy</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Redis online, PostgreSQL offline</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Event Processing</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-900 font-medium">Active</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Real-time event streaming enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationAnalytics;
