import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiDownload, FiCalendar } from 'react-icons/fi';

const AnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('week');

  const orderData = [
    { date: 'Mon', orders: 45, revenue: 1200, users: 120 },
    { date: 'Tue', orders: 52, revenue: 1400, users: 135 },
    { date: 'Wed', orders: 48, revenue: 1300, users: 128 },
    { date: 'Thu', orders: 61, revenue: 1600, users: 155 },
    { date: 'Fri', orders: 75, revenue: 2000, users: 185 },
    { date: 'Sat', orders: 89, revenue: 2400, users: 210 },
    { date: 'Sun', orders: 72, revenue: 2100, users: 175 },
  ];

  const categoryData = [
    { name: 'Coffee', value: 45, fill: '#ff93a3' },
    { name: 'Tea', value: 20, fill: '#ffc0cb' },
    { name: 'Pastry', value: 25, fill: '#ffb3c1' },
    { name: 'Sandwich', value: 10, fill: '#ffd4e5' },
  ];

  const topItems = [
    { name: 'Cappuccino', orders: 234, revenue: 1053 },
    { name: 'Espresso', orders: 198, revenue: 693 },
    { name: 'Latte', orders: 187, revenue: 935 },
    { name: 'Croissant', orders: 156, revenue: 468 },
    { name: 'Americano', orders: 145, revenue: 435 },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track sales, orders, and customer insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FiDownload size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Orders', value: '442', change: '+12%' },
          { label: 'Total Revenue', value: '$12,100', change: '+18%' },
          { label: 'Avg Order Value', value: '$27.35', change: '+5%' },
          { label: 'Customer Satisfaction', value: '4.8/5', change: '+0.2' },
        ].map((metric, idx) => (
          <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{metric.value}</p>
            <p className="text-sm text-green-600 mt-2">{metric.change} from last period</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders & Revenue */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders & Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#ff93a3" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ffc0cb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Item Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orders</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.orders}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">${item.revenue}</td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-semibold">↑ 12%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

