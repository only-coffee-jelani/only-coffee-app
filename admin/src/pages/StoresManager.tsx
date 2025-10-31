import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiMail, FiX, FiSave, FiLoader, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useAuthStore } from '../store/authStore';
import { AddressSuggestion } from '../hooks/useAddressAutocomplete';
import { API_BASE } from '../config';

const StoresManager = () => {
  const { user } = useAuthStore();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'coffee_shop',
    address: '',
    city: '',
    state: 'LA',
    zipCode: '',
    phone: '',
    email: '',
    storeImageUrl: '',
    isActive: true,
    latitude: 0,
    longitude: 0,
  });

  // Fetch stores from backend
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/stores`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stores');

      const data = await response.json();
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      type: 'coffee_shop',
      address: '',
      city: '',
      state: 'LA',
      zipCode: '',
      phone: '',
      email: '',
      storeImageUrl: '',
      isActive: true,
      latitude: 0,
      longitude: 0,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (store: any) => {
    setFormData({
      name: store.name,
      type: store.type || 'coffee_shop',
      address: store.address || '',
      city: store.city,
      state: store.state,
      zipCode: store.zipCode || '',
      phone: store.phone || '',
      email: store.email || '',
      storeImageUrl: store.storeImageUrl || '',
      isActive: store.isActive,
      latitude: store.latitude || 0,
      longitude: store.longitude || 0,
    });
    setEditingId(store.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For coffee shops, address is required
    if (formData.type === 'coffee_shop' && !formData.address) {
      toast.error('Address is required for coffee shops');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        toast.error('You are not logged in. Please log in first.');
        return;
      }

      if (editingId) {
        // Update existing store
        const response = await fetch(`${API_BASE}/stores/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to update store: ${response.status}`);
        }

        const updatedStore = await response.json();
        setStores(stores.map(s => s.id === editingId ? updatedStore : s));
        toast.success('Store updated successfully!');
      } else {
        // Create new store
        const response = await fetch(`${API_BASE}/stores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to create store: ${response.status}`);
        }

        const newStore = await response.json();
        setStores([newStore, ...stores]);
        toast.success('Store created successfully!');
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving store:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      address: suggestion.address,
      city: suggestion.city,
      state: suggestion.state,
      zipCode: suggestion.zipCode,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }));
    toast.success('Address auto-filled!');
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({ show: true, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/stores/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete store');

      setStores(stores.filter(s => s.id !== deleteModal.id));
      toast.success('Store deleted successfully!');
      setDeleteModal({ show: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store');
    }
  };

  // Filter stores by type and search
  const coffeeShops = useMemo(() => {
    return stores
      .filter(s => s.type === 'coffee_shop')
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   s.city.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [stores, searchTerm]);

  const mobileBars = useMemo(() => {
    return stores
      .filter(s => s.type === 'mobile_coffee_bar')
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   s.city.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [stores, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Store Locations</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage all Only Coffee store locations and details</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-6 py-3 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: '#ff93a3' }}
          >
            <FiPlus size={18} />
            Add Store
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stores by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
            />
          </div>
        </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-50 to-orange-50 border-b-2 border-pink-100 p-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {editingId ? 'Edit Store' : 'Add Store'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Store Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  placeholder="e.g., Downtown"
                />
              </div>

              {/* Store Type */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Store Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                >
                  <option value="coffee_shop">Coffee Shop</option>
                  <option value="mobile_coffee_bar">Mobile Coffee Bar</option>
                </select>
              </div>

              {/* Address with Autocomplete - Only for Coffee Shops */}
              {formData.type === 'coffee_shop' && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Address * (with autocomplete)</label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    onSelectSuggestion={handleSelectAddressSuggestion}
                    placeholder="Start typing an address..."
                  />
                </div>
              )}

              {/* City, State, Zip */}
              <div className={`grid gap-4 ${formData.type === 'coffee_shop' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>
                {formData.type === 'coffee_shop' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* Store Image */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Store Image</label>
                <ImageUploader
                  onUpload={(url) => setFormData({ ...formData, storeImageUrl: url })}
                  folder="stores"
                  imageUrl={formData.storeImageUrl}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border-2 border-pink-100">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#ff93a3' }}
                />
                <label className="ml-3 text-sm font-bold text-gray-900">Active Store</label>
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
                      Save Store
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-96 max-w-6xl mx-auto">
          <div className="text-center">
            <FiLoader size={48} className="animate-spin text-pink-500 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Loading stores...</p>
          </div>
        </div>
      )}

      {/* Stores Tables */}
      {!loading && (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Physical Coffee Shops Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
            {/* Table Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">☕ Physical Coffee Shops</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">{coffeeShops.length} store{coffeeShops.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Table */}
            {coffeeShops.length === 0 ? (
              <div className="text-center py-12 px-8">
                <p className="text-gray-500 text-lg">No coffee shops found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-48">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-64">Address</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coffeeShops.map((store, index) => (
                      <tr
                        key={store.id}
                        className={`border-b border-gray-100 transition-all duration-200 group ${
                          index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/50'
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-5">
                          <p className="text-lg font-bold text-gray-900 line-clamp-1">{store.name}</p>
                        </td>
                        {/* Address with City and Phone */}
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{store.address || '—'}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-2">
                              <FiMapPin size={14} className="text-pink-500 flex-shrink-0" />
                              {store.city}, {store.state} {store.zipCode}
                            </p>
                            {store.phone && (
                              <p className="text-xs text-gray-600 flex items-center gap-2">
                                <FiPhone size={14} className="text-pink-500 flex-shrink-0" />
                                {store.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {store.isActive ? '✓ Active' : 'Inactive'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(store)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(store.id, store.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            )}
          </div>

          {/* Mobile Coffee Bars Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
            {/* Table Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🚐 Mobile Coffee Bars</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">{mobileBars.length} bar{mobileBars.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Table */}
            {mobileBars.length === 0 ? (
              <div className="text-center py-12 px-8">
                <p className="text-gray-500 text-lg">No mobile coffee bars found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-48">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-64">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mobileBars.map((store, index) => (
                      <tr
                        key={store.id}
                        className={`border-b border-gray-100 transition-all duration-200 group ${
                          index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/50'
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-5">
                          <p className="text-lg font-bold text-gray-900 line-clamp-1">{store.name}</p>
                        </td>
                        {/* Location with City, State and Phone */}
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <FiMapPin size={14} className="text-pink-500 flex-shrink-0" />
                              {store.city}, {store.state}
                            </p>
                            {store.phone && (
                              <p className="text-xs text-gray-600 flex items-center gap-2">
                                <FiPhone size={14} className="text-pink-500 flex-shrink-0" />
                                {store.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {store.isActive ? '✓ Active' : 'Inactive'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(store)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(store.id, store.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            )}
          </div>

          {/* Empty State */}
          {stores.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-md">
              <div className="text-5xl mb-4">🏪</div>
              <p className="text-gray-600 text-lg font-medium mb-2">No stores yet</p>
              <p className="text-gray-500 text-sm">Create your first store to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <FiTrash2 size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Delete Store?</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-gray-600 text-center mb-2">
                You're about to delete:
              </p>
              <p className="text-center text-lg font-bold text-gray-900 mb-6 px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                "{deleteModal.name}"
              </p>
              <p className="text-gray-500 text-sm text-center">
                This action cannot be undone. The store will be permanently removed.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, name: '' })}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg hover:shadow-xl"
              >
                Delete Store
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StoresManager;

