import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiUsers, FiShoppingCart, FiDollarSign } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    avgOrderValue: 0,
  });

  const [chartData, setChartData] = useState([
    { date: 'Mon', orders: 45, revenue: 1200 },
    { date: 'Tue', orders: 52, revenue: 1400 },
    { date: 'Wed', orders: 48, revenue: 1300 },
    { date: 'Thu', orders: 61, revenue: 1600 },
    { date: 'Fri', orders: 75, revenue: 2000 },
    { date: 'Sat', orders: 89, revenue: 2400 },
    { date: 'Sun', orders: 72, revenue: 2100 },
  ]);

  useEffect(() => {
    // Fetch stats from API
    setStats({
      totalOrders: 442,
      totalRevenue: 12100,
      activeUsers: 1234,
      avgOrderValue: 27.35,
    });
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiShoppingCart}
          label="Total Orders"
          value={stats.totalOrders}
          color="#ff93a3"
        />
        <StatCard
          icon={FiDollarSign}
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          color="#ff93a3"
        />
        <StatCard
          icon={FiUsers}
          label="Active Users"
          value={stats.activeUsers}
          color="#ff93a3"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Avg Order Value"
          value={`$${stats.avgOrderValue.toFixed(2)}`}
          color="#ff93a3"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders This Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#ff93a3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue This Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#ff93a3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors text-left">
            <p className="font-semibold text-gray-900">Update Splash Screen</p>
            <p className="text-sm text-gray-600 mt-1">Change launch modal image</p>
          </button>
          <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors text-left">
            <p className="font-semibold text-gray-900">Manage Carousel</p>
            <p className="text-sm text-gray-600 mt-1">Update promotional images</p>
          </button>
          <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors text-left">
            <p className="font-semibold text-gray-900">Add Menu Item</p>
            <p className="text-sm text-gray-600 mt-1">Create new product</p>
          </button>
          <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors text-left">
            <p className="font-semibold text-gray-900">View Analytics</p>
            <p className="text-sm text-gray-600 mt-1">Check performance metrics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

