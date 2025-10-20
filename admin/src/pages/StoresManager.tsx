import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiMail, FiX, FiSave, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useAuthStore } from '../store/authStore';
import { AddressSuggestion } from '../hooks/useAddressAutocomplete';

const API_BASE = 'http://localhost:3000/api/v1';

const StoresManager = () => {
  const { user } = useAuthStore();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/stores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete store');

      setStores(stores.filter(s => s.id !== id));
      toast.success('Store deleted successfully!');
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 p-8">
      {/* Header */}
      <div className="mb-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">Location Management</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
              Store Locations
            </h1>
            <p className="text-gray-600 text-lg">Manage all Only Coffee store locations and details</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:shadow-lg"
            style={{ backgroundColor: '#ff93a3' }}
          >
            <FiPlus size={20} />
            Add Store
          </button>
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

      {/* Stores Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stores.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No stores found. Create your first store!</p>
            </div>
          ) : (
            stores.map(store => (
              <div key={store.id} className="bg-white rounded-3xl border-2 border-pink-100 overflow-hidden hover:shadow-2xl hover:border-pink-300 transition-all duration-300">
                {/* Store Image */}
                {store.storeImageUrl && (
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img src={store.storeImageUrl} alt={store.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                )}

            {/* Store Info */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {store.type === 'coffee_shop' ? '☕ Coffee Shop' : '🚐 Mobile Coffee Bar'}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {store.isActive ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-6 p-4 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl border border-pink-100">
                <p className="flex items-start gap-3">
                  <FiMapPin size={18} className="text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    {store.address ? `${store.address}, ${store.city}, ${store.state} ${store.zipCode}` : `${store.city}, ${store.state}`}
                  </span>
                </p>
                {store.phone && (
                  <p className="flex items-center gap-3">
                    <FiPhone size={18} className="text-pink-500 flex-shrink-0" />
                    <span className="text-gray-700">{store.phone}</span>
                  </p>
                )}
                {store.email && (
                  <p className="flex items-center gap-3">
                    <FiMail size={18} className="text-pink-500 flex-shrink-0" />
                    <span className="text-gray-700">{store.email}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-6 border-t-2 border-pink-100">
                <button
                  onClick={() => handleEdit(store)}
                  className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-pink-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <FiEdit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl border-2 border-red-200 transition-colors"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StoresManager;

