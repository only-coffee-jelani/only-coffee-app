import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiDownload,
  FiFilter,
  FiChevronDown,
  FiTrendingUp,
  FiDollarSign,
  FiShoppingCart,
  FiAward,
  FiCalendar,
  FiMail,
  FiPhone,
  FiUser,
  FiBarChart2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

interface User {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string | null;
  createdAt: string;
  isActive: boolean;
  emailVerified: boolean;
  marketingOptIn: boolean;
  isLoyaltyMember: boolean;
  lastLoginAt: string | null;
  churnRisk?: string;
  avgOrderValue?: number;
  lastActivityDate?: string | null;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('lastOrderDate');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    loyaltyMembers: 0,
    avgLifetimeValue: 0,
    churnRiskCount: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, selectedTier, selectedStatus, sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : data.data || [];
      
      setUsers(usersArray);
      calculateStats(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList: User[]) => {
    const activeUsers = usersList.filter(u => u.isActive).length;
    const loyaltyMembers = usersList.filter(u => u.isLoyaltyMember).length;
    const totalSpent = usersList.reduce((sum, u) => sum + (u.totalSpent || 0), 0);
    const avgLifetimeValue = usersList.length > 0 ? totalSpent / usersList.length : 0;
    const churnRiskCount = usersList.filter(u => u.churnRisk === 'high').length;

    setStats({
      totalUsers: usersList.length,
      activeUsers,
      loyaltyMembers,
      avgLifetimeValue,
      churnRiskCount,
    });
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTier = selectedTier === 'all' || user.loyaltyTier === selectedTier;
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && user.isActive) ||
        (selectedStatus === 'inactive' && !user.isActive) ||
        (selectedStatus === 'churn-risk' && user.churnRisk === 'high');

      return matchesSearch && matchesTier && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'lastOrderDate':
          return new Date(b.lastOrderDate || 0).getTime() - new Date(a.lastOrderDate || 0).getTime();
        case 'totalSpent':
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case 'loyaltyPoints':
          return b.loyaltyPoints - a.loyaltyPoints;
        case 'orderCount':
          return (b.orderCount || 0) - (a.orderCount || 0);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const exportUsers = () => {
    const csv = [
      ['Email', 'Name', 'Phone', 'Tier', 'Points', 'Total Spent', 'Orders', 'Last Order', 'Active', 'Loyalty Member'],
      ...filteredUsers.map(u => [
        u.email,
        `${u.firstName} ${u.lastName}`,
        u.phone || '',
        u.loyaltyTier,
        u.loyaltyPoints,
        u.totalSpent,
        u.orderCount,
        u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString() : 'Never',
        u.isActive ? 'Yes' : 'No',
        u.isLoyaltyMember ? 'Yes' : 'No',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Users exported successfully');
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon size={32} color={color} className="opacity-20" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Users & Analytics</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage customers, track engagement, and drive sales</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FiUser} label="Total Users" value={stats.totalUsers} color="#ff93a3" />
          <StatCard icon={FiTrendingUp} label="Active Users" value={stats.activeUsers} color="#ff93a3" />
          <StatCard icon={FiAward} label="Loyalty Members" value={stats.loyaltyMembers} color="#ff93a3" />
          <StatCard icon={FiDollarSign} label="Avg Lifetime Value" value={`$${stats.avgLifetimeValue.toFixed(2)}`} color="#ff93a3" />
          <StatCard icon={FiBarChart2} label="Churn Risk" value={stats.churnRiskCount} color="#ff93a3" />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loyalty Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="black">Black</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="churn-risk">Churn Risk</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="lastOrderDate">Last Order</option>
                <option value="totalSpent">Total Spent</option>
                <option value="loyaltyPoints">Loyalty Points</option>
                <option value="orderCount">Order Count</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportUsers}
              className="px-6 py-2 text-white font-bold rounded-lg transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2"
              style={{ backgroundColor: '#ff93a3' }}
            >
              <FiDownload size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Last Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            {user.loyaltyTier.charAt(0).toUpperCase() + user.loyaltyTier.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{user.loyaltyPoints.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">${(user.totalSpent || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-900">{user.orderCount || 0}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {user.lastOrderDate ? new Date(user.lastOrderDate).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                            className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                          >
                            Details <FiChevronDown size={16} />
                          </button>
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Phone</p>
                                <p className="text-sm text-gray-900 mt-1">{user.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Member Since</p>
                                <p className="text-sm text-gray-900 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Last Login</p>
                                <p className="text-sm text-gray-900 mt-1">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Avg Order Value</p>
                                <p className="text-sm text-gray-900 mt-1">${((user.totalSpent || 0) / Math.max(user.orderCount || 1, 1)).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Email Verified</p>
                                <p className="text-sm text-gray-900 mt-1">{user.emailVerified ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Marketing Opt-In</p>
                                <p className="text-sm text-gray-900 mt-1">{user.marketingOptIn ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Loyalty Member</p>
                                <p className="text-sm text-gray-900 mt-1">{user.isLoyaltyMember ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-medium">Churn Risk</p>
                                <p className={`text-sm font-medium mt-1 ${user.churnRisk === 'high' ? 'text-red-600' : 'text-green-600'}`}>
                                  {user.churnRisk ? user.churnRisk.charAt(0).toUpperCase() + user.churnRisk.slice(1) : 'Low'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
};

export default UsersPage;

