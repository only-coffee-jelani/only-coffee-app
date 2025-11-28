import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiLoader, FiImage, FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../config';

const SplashScreenManager = () => {
  const { user } = useAuthStore();
  const [splashScreens, setSplashScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; title: string }>({ show: false, id: null, title: '' });

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [durationRange, setDurationRange] = useState({ min: 1, max: 30 });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'duration'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '', // This will store the assetId (UUID)
    imagePreviewUrl: '', // This will store the actual URL for display
    displayDuration: 3,
    targetMenuItemId: '',
    targetUrl: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  useEffect(() => {
    fetchSplashScreens();
  }, []);

  const fetchSplashScreens = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/splash-screen`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch splash screens');

      const data = await response.json();

      // Map backend field names to frontend field names
      const mappedData = (data.data || []).map((splash: any) => ({
        id: splash.splashId,
        title: splash.title,
        description: splash.subtitle,
        imageUrl: splash.imageAsset?.url || '', // Get the actual image URL from the imageAsset relation
        imageAssetId: splash.imageAssetId, // Keep the UUID for updates
        displayDuration: splash.durationSeconds,
        targetUrl: splash.deeplink,
        startDate: splash.startAt,
        endDate: splash.endAt,
        isActive: splash.isActive,
        createdAt: splash.createdAt,
        updatedAt: splash.updatedAt,
      }));

      setSplashScreens(mappedData);
    } catch (error) {
      console.error('Error fetching splash screens:', error);
      toast.error('Failed to load splash screens');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort splash screens
  const filteredAndSortedSplashes = useMemo(() => {
    let filtered = splashScreens.filter(splash => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = splash.title.toLowerCase().includes(searchLower) ||
        (splash.description && splash.description.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && splash.isActive) ||
        (statusFilter === 'inactive' && !splash.isActive);

      // Duration range filter
      const matchesDuration = splash.displayDuration >= durationRange.min &&
        splash.displayDuration <= durationRange.max;

      return matchesSearch && matchesStatus && matchesDuration;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'duration':
          compareValue = a.displayDuration - b.displayDuration;
          break;
        case 'oldest':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'newest':
        default:
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [splashScreens, searchTerm, statusFilter, durationRange, sortBy, sortOrder]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (assetId: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: assetId, // Store the assetId (UUID) for saving
      imagePreviewUrl: url, // Store the URL for display
    }));
    toast.success('Image uploaded successfully!');
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      imagePreviewUrl: '',
      displayDuration: 3,
      targetMenuItemId: '',
      targetUrl: '',
      startDate: '',
      endDate: '',
      isActive: false,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (splash: any) => {
    setFormData({
      title: splash.title || '',
      description: splash.description || '',
      imageUrl: splash.imageAssetId || '', // UUID for saving
      imagePreviewUrl: splash.imageUrl || '', // URL for display
      displayDuration: splash.displayDuration || 3,
      targetMenuItemId: '',
      targetUrl: splash.targetUrl || '',
      startDate: splash.startDate ? splash.startDate.split('T')[0] : '',
      endDate: splash.endDate ? splash.endDate.split('T')[0] : '',
      isActive: splash.isActive || false,
    });
    setEditingId(splash.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ show: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/splash-screen/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete splash screen');

      setSplashScreens(splashScreens.filter(s => s.id !== deleteModal.id));
      setDeleteModal({ show: false, id: null, title: '' });
      toast.success('Splash screen deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete splash screen');
    }
  };

  const handleRemoveActive = async () => {
    const activeSplash = splashScreens.find(s => s.isActive);
    if (!activeSplash) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/splash-screen/${activeSplash.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) throw new Error('Failed to deactivate splash screen');

      await fetchSplashScreens();
      toast.success('Active splash screen removed!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove active splash screen');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl) {
      toast.error('Title and image are required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');

      // Map frontend field names to backend field names
      const dataToSave = {
        title: formData.title,
        subtitle: formData.description || null,
        imageAssetId: formData.imageUrl, // This should be a UUID from media_assets
        durationSeconds: formData.displayDuration,
        startAt: formData.startDate || null,
        endAt: formData.endDate || null,
        isActive: formData.isActive,
        deeplink: formData.targetUrl || null,
        priority: 0,
      };

      const url = editingId
        ? `${API_BASE}/splash-screen/${editingId}`
        : `${API_BASE}/splash-screen`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save error:', errorData);
        throw new Error(errorData.message || 'Failed to save');
      }

      await fetchSplashScreens();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        imagePreviewUrl: '',
        displayDuration: 3,
        targetMenuItemId: '',
        targetUrl: '',
        startDate: '',
        endDate: '',
        isActive: false,
      });
      toast.success(editingId ? 'Splash screen updated!' : 'Splash screen created!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save splash screen');
    } finally {
      setSaving(false);
    }
  };

  const activeSplash = splashScreens.find(s => s.isActive);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Splash Screens</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage promotional splash screens for your app</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddNew}
              className="px-6 py-3 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: '#ff93a3' }}
            >
              <FiPlus size={18} />
              New Splash Screen
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 mb-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              {/* Form Header */}
              <div className="sticky top-0 z-50 bg-gradient-to-r from-pink-50 via-white to-pink-50 px-8 py-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Splash Screen' : 'Create New Splash Screen'}</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Form Content */}
              <form className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g., Fall Special: Waffolino"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Image *</label>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <ImageUploader
                      onUpload={handleImageUpload}
                      folder="splash-screens"
                      imageUrl={formData.imagePreviewUrl}
                      onClear={() => setFormData(prev => ({ ...prev, imageUrl: '', imagePreviewUrl: '' }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe your splash screen..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Duration (seconds)</label>
                    <input
                      type="number"
                      name="displayDuration"
                      value={formData.displayDuration}
                      onChange={handleChange}
                      min="1"
                      max="30"
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Active Status</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative w-full h-12 rounded-xl transition-all duration-300 flex items-center px-1 ${
                        formData.isActive
                          ? 'bg-gradient-to-r from-green-400 to-green-500'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400'
                      }`}
                    >
                      <span
                        className={`absolute h-10 w-1/2 rounded-lg bg-white shadow-lg transition-all duration-300 flex items-center justify-center font-bold text-sm ${
                          formData.isActive ? 'right-1' : 'left-1'
                        }`}
                      >
                        {formData.isActive ? '✓ Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t-2 border-pink-100">
                  <button
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                    className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl font-bold text-gray-700 hover:bg-pink-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#ff93a3' }}
                  >
                    {saving ? (
                      <>
                        <FiLoader size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={18} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <FiLoader size={48} className="animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Loading splash screens...</p>
            </div>
          </div>
        )}

        {/* Search, Filter & Sort Section */}
        {!loading && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-md hover:shadow-lg transition-shadow">
              {/* Search Bar */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">🔍 Search Splash Screens</label>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
                  />
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">📊 Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Duration Range Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">⏱️ Duration (seconds)</label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        value={durationRange.min}
                        onChange={(e) => setDurationRange({ ...durationRange, min: Number(e.target.value) })}
                        placeholder="Min"
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      />
                    </div>
                    <span className="text-gray-400 font-bold pb-3">–</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        value={durationRange.max}
                        onChange={(e) => setDurationRange({ ...durationRange, max: Number(e.target.value) })}
                        placeholder="Max"
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">↕️ Sort By</label>
                  <div className="flex gap-2 items-end">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="title">Title</option>
                      <option value="duration">Duration</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-pink-50 hover:border-pink-300 transition-all flex items-center justify-center gap-2 flex-shrink-0"
                      title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                    >
                      {sortOrder === 'asc' ? <FiArrowUp size={18} /> : <FiArrowDown size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-600">
                  Showing <span className="text-pink-600 font-bold">{filteredAndSortedSplashes.length}</span> of <span className="text-pink-600 font-bold">{splashScreens.length}</span> splash screens
                </p>
                {(searchTerm || statusFilter !== 'all' || durationRange.min > 1 || durationRange.max < 30 || sortBy !== 'newest') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDurationRange({ min: 1, max: 30 });
                      setSortBy('newest');
                      setSortOrder('asc');
                    }}
                    className="text-sm font-bold text-pink-600 hover:text-pink-700 hover:bg-pink-50 px-3 py-1 rounded-lg transition-all"
                  >
                    ✕ Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Splash Screens Table */}
        {!loading && (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-all">
            {splashScreens.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🖼️</div>
                <p className="text-gray-600 text-lg font-medium mb-2">No splash screens yet</p>
                <p className="text-gray-500 text-sm">Create your first splash screen to get started</p>
              </div>
            ) : filteredAndSortedSplashes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg font-medium mb-2">No splash screens match your filters</p>
                <p className="text-gray-500 text-sm">Try adjusting your search criteria or filters</p>
              </div>
            ) : (
              <>
                {/* Table Header Section */}
                <div className="px-8 py-6 border-b border-gray-200 bg-white">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">All Splash Screens</h3>
                  <p className="text-sm text-gray-600">{filteredAndSortedSplashes.length} splash screen{filteredAndSortedSplashes.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">Image</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-48">Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date Range</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Actions</th>
                      </tr>
                    </thead>
                  <tbody>
                    {filteredAndSortedSplashes.map((splash, index) => (
                      <tr
                        key={splash.id}
                        className={`border-b border-gray-100 transition-all duration-200 group ${
                          index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/50'
                        }`}
                      >
                        <td className="px-6 py-5">
                          {splash.imageUrl ? (
                            <div className="h-16 w-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-md group-hover:shadow-lg transition-all cursor-pointer" onClick={() => setShowFullImage(splash.imageUrl)}>
                              <img
                                src={splash.imageUrl}
                                alt={splash.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 shadow-md">
                              <FiImage size={24} />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">{splash.title}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full text-sm font-bold">
                            {splash.displayDuration}s
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            {splash.startDate && splash.endDate ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                                    {splash.startDate.split('T')[0]}
                                  </span>
                                  <span className="text-gray-400 font-bold">→</span>
                                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                                    {splash.endDate.split('T')[0]}
                                  </span>
                                </div>
                              </>
                            ) : splash.startDate ? (
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold w-fit">
                                From {splash.startDate.split('T')[0]}
                              </span>
                            ) : splash.endDate ? (
                              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold w-fit">
                                Until {splash.endDate.split('T')[0]}
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold w-fit italic">
                                No limit
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {splash.isActive ? (
                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 text-green-800 rounded-full text-sm font-bold border border-green-200 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                              Live
                            </span>
                          ) : (
                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-full text-sm font-bold border border-gray-200">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(splash)}
                              className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all hover:shadow-md active:scale-95"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(splash.id, splash.title)}
                              className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:shadow-md active:scale-95"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => setShowFullImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50"
          >
            <FiX size={32} />
          </button>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={showFullImage}
              alt="Full Size Splash Screen"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <FiTrash2 size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Delete Splash Screen?</h2>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-600 text-center mb-2">You're about to delete:</p>
              <p className="text-center text-lg font-bold text-gray-900 mb-6 px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                "{deleteModal.title}"
              </p>
              <p className="text-gray-500 text-sm text-center">This action cannot be undone.</p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, title: '' })}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg hover:shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreenManager;

