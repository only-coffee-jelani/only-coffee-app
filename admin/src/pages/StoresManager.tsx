import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiMail, FiX, FiSave, FiLoader, FiSearch, FiDownload, FiClock, FiFilter, FiCheckCircle, FiXCircle, FiRefreshCw, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import AddressAutocomplete from '../components/AddressAutocomplete';
import ResizableTableHeader from '../components/ResizableTableHeader';
import { useResizableColumns, ColumnConfig } from '../hooks/useResizableColumns';
import { useAuthStore } from '../store/authStore';
import { AddressSuggestion } from '../hooks/useAddressAutocomplete';
import { WORLD_TIMEZONES, getTimezonesByRegion, POPULAR_TIMEZONES, getTimezoneDisplayName } from '../data/timezones';
import { COUNTRIES, getSortedCountries, getContinentByCountryCode } from '../data/countries';
import { API_BASE } from '../config';

interface StoreType {
  storeTypeId: string;
  code: string;
  description: string | null;
}

// Helper function to get display name from code
const getStoreTypeName = (code: string): string => {
  const names: Record<string, string> = {
    'coffee_shop': 'Coffee Shop',
    'kiosk': 'Kiosk',
    'food_truck': 'Food Truck',
    'popup': 'Pop-up',
  };
  return names[code] || code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

interface StoreHours {
  storeHoursId?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface Store {
  storeId: string;
  name: string;
  storeTypeId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  countryCode: string | null;
  continent: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  toastLocationId: string | null;
  isActive: boolean;
  acceptingOrders: boolean;
  storeImageUrl: string | null;
  description: string | null;
  timezone: string;
  openedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  storeType?: StoreType;
  storeHours?: StoreHours[];
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get sorted countries for dropdown (195+ countries)
const SORTED_COUNTRIES = getSortedCountries();

const StoresManager = () => {
  const { user } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'type'>('created');
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    storeTypeId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    countryCode: 'US',
    continent: 'North America',
    phone: '',
    email: '',
    toastLocationId: '',
    storeImageUrl: '',
    description: '',
    timezone: 'America/Chicago',
    isActive: true,
    acceptingOrders: true,
    latitude: null as number | null,
    longitude: null as number | null,
    storeHours: [] as StoreHours[],
  });

  // Resizable columns configuration
  const tableColumns: ColumnConfig[] = useMemo(() => [
    { key: 'name', label: 'Name', minWidth: 150, defaultWidth: 200, maxWidth: 400 },
    { key: 'type', label: 'Type', minWidth: 100, defaultWidth: 150, maxWidth: 250 },
    { key: 'address', label: 'Address', minWidth: 200, defaultWidth: 300, maxWidth: 600 },
    { key: 'contact', label: 'Contact', minWidth: 150, defaultWidth: 200, maxWidth: 400 },
    { key: 'status', label: 'Status', minWidth: 120, defaultWidth: 150, maxWidth: 250 },
    { key: 'actions', label: 'Actions', minWidth: 120, defaultWidth: 150, maxWidth: 200 }
  ], []);

  const { columnWidths, handleMouseDown, resizingColumn } = useResizableColumns(
    tableColumns,
    'stores-manager'
  );

  // Fetch stores and store types from backend
  useEffect(() => {
    fetchStores();
    fetchStoreTypes();
  }, []);

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.timezone-selector')) {
        setShowTimezoneDropdown(false);
      }
    };

    if (showTimezoneDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimezoneDropdown]);

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

      const result = await response.json();
      // Backend returns {success, data, count} format
      setStores(result.data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/stores/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch store types');

      const data = await response.json();
      setStoreTypes(data || []);
    } catch (error) {
      console.error('Error fetching store types:', error);
    }
  };

  // Initialize default store hours (6 AM - 8 PM for all days)
  const initializeDefaultHours = (): StoreHours[] => {
    return DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      openTime: '06:00:00',
      closeTime: '20:00:00',
    }));
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      storeTypeId: storeTypes.length > 0 ? storeTypes[0].storeTypeId : '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      countryCode: 'US',
      continent: 'North America',
      phone: '',
      email: '',
      toastLocationId: '',
      storeImageUrl: '',
      description: '',
      timezone: 'America/Chicago',
      isActive: true,
      acceptingOrders: true,
      latitude: null,
      longitude: null,
      storeHours: initializeDefaultHours(),
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (store: Store) => {
    // Convert store hours from HH:MM:SS to HH:MM format for time inputs
    const formattedStoreHours = store.storeHours && store.storeHours.length > 0
      ? store.storeHours.map(hours => ({
          ...hours,
          openTime: hours.openTime.substring(0, 5), // Convert "06:00:00" to "06:00"
          closeTime: hours.closeTime.substring(0, 5), // Convert "20:00:00" to "20:00"
        }))
      : initializeDefaultHours();

    setFormData({
      name: store.name,
      storeTypeId: store.storeTypeId || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      zipCode: store.zipCode || '',
      country: store.country || 'United States',
      countryCode: store.countryCode || 'US',
      continent: store.continent || 'North America',
      phone: store.phone || '',
      email: store.email || '',
      toastLocationId: store.toastLocationId || '',
      storeImageUrl: store.storeImageUrl || '',
      description: store.description || '',
      timezone: store.timezone || 'America/Chicago',
      isActive: store.isActive,
      acceptingOrders: store.acceptingOrders,
      latitude: store.latitude,
      longitude: store.longitude,
      storeHours: formattedStoreHours,
    });
    setEditingId(store.storeId);
    setShowForm(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name) {
      toast.error('Store name is required');
      return;
    }
    if (!formData.city) {
      toast.error('City is required');
      return;
    }
    if (!formData.country) {
      toast.error('Country is required');
      return;
    }
    if (!formData.countryCode) {
      toast.error('Country code is required');
      return;
    }
    if (!formData.continent) {
      toast.error('Continent is required');
      return;
    }

    // USA-specific validation
    if (formData.countryCode === 'US' || formData.country === 'United States') {
      if (!formData.state) {
        toast.error('State is required for USA stores');
        return;
      }
      if (!formData.zipCode) {
        toast.error('ZIP code is required for USA stores');
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        toast.error('You are not logged in. Please log in first.');
        return;
      }

      // Convert store hours from HH:MM to HH:MM:SS format
      const formattedStoreHours = formData.storeHours.map(hours => ({
        ...hours,
        openTime: hours.openTime.length === 5 ? `${hours.openTime}:00` : hours.openTime,
        closeTime: hours.closeTime.length === 5 ? `${hours.closeTime}:00` : hours.closeTime,
      }));

      const payload = {
        ...formData,
        storeTypeId: formData.storeTypeId || null,
        storeHours: formattedStoreHours,
      };

      if (editingId) {
        // Update existing store
        const response = await fetch(`${API_BASE}/stores/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to update store: ${response.status}`);
        }

        const updatedStore = await response.json();
        setStores(stores.map(s => s.storeId === editingId ? updatedStore : s));
        toast.success('Store updated successfully!');
      } else {
        // Create new store
        const response = await fetch(`${API_BASE}/stores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
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
    // Get continent from country code
    const continent = getContinentByCountryCode(suggestion.countryCode) || '';

    setFormData(prev => ({
      ...prev,
      address: suggestion.address,
      city: suggestion.city || '',
      state: suggestion.state || '',
      zipCode: suggestion.zipCode || '',
      country: suggestion.country || '',
      countryCode: suggestion.countryCode || '',
      continent: continent,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }));

    toast.success('Address auto-filled with city, state, and country!');
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

      setStores(stores.filter(s => s.storeId !== deleteModal.id));
      toast.success('Store deleted successfully!');
      setDeleteModal({ show: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store');
    }
  };

  // Statistics
  const statistics = useMemo(() => {
    const totalStores = stores.length;
    const activeStores = stores.filter(s => s.isActive).length;
    const acceptingOrders = stores.filter(s => s.acceptingOrders).length;
    const storesByType = storeTypes.map(type => ({
      type: getStoreTypeName(type.code),
      count: stores.filter(s => s.storeTypeId === type.storeTypeId).length,
    }));

    return {
      totalStores,
      activeStores,
      acceptingOrders,
      inactiveStores: totalStores - activeStores,
      storesByType,
    };
  }, [stores, storeTypes]);

  // Filter and sort stores
  const filteredAndSortedStores = useMemo(() => {
    let filtered = stores.filter(store => {
      // Search filter
      const matchesSearch =
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (store.phone && store.phone.includes(searchTerm));

      // Type filter
      const matchesType = filterType === 'all' || store.storeTypeId === filterType;

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && store.isActive) ||
        (filterStatus === 'inactive' && !store.isActive) ||
        (filterStatus === 'accepting' && store.acceptingOrders) ||
        (filterStatus === 'not-accepting' && !store.acceptingOrders);

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'type') {
        const aType = a.storeType?.name || '';
        const bType = b.storeType?.name || '';
        return aType.localeCompare(bType);
      }
      return 0;
    });

    return filtered;
  }, [stores, searchTerm, filterType, filterStatus, sortBy]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Name', 'Type', 'Address', 'City', 'State', 'ZIP', 'Country', 'Continent', 'Phone', 'Email', 'Toast Location ID', 'Active', 'Accepting Orders', 'Created At'];
    const rows = filteredAndSortedStores.map(store => [
      store.name,
      store.storeType?.name || 'N/A',
      store.address || 'N/A',
      store.city || 'N/A',
      store.state || 'N/A',
      store.zipCode || 'N/A',
      store.country || 'N/A',
      store.continent || 'N/A',
      store.phone || 'N/A',
      store.email || 'N/A',
      store.toastLocationId || 'N/A',
      store.isActive ? 'Yes' : 'No',
      store.acceptingOrders ? 'Yes' : 'No',
      new Date(store.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exported successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Store Locations</h1>
              <p className="text-gray-600 mt-2 text-lg">Manage all Only Coffee store locations and details</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="px-6 py-3 bg-white border-2 border-pink-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FiDownload size={18} />
                Export CSV
              </button>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Stores</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalStores}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <FiMapPin size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Active Stores</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statistics.activeStores}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <FiCheckCircle size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Accepting Orders</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{statistics.acceptingOrders}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                <FiClock size={28} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Inactive Stores</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{statistics.inactiveStores}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
                <FiXCircle size={28} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stores by name, address, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" size={18} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
              >
                <option value="all">All Types</option>
                {storeTypes.map(type => (
                  <option key={type.storeTypeId} value={type.storeTypeId}>{getStoreTypeName(type.code)}</option>
                ))}
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="accepting">Accepting Orders</option>
              <option value="not-accepting">Not Accepting Orders</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'type')}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
            >
              <option value="created">Sort by: Newest First</option>
              <option value="name">Sort by: Name</option>
              <option value="type">Sort by: Type</option>
            </select>

            <button
              onClick={fetchStores}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <FiLoader size={48} className="animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Loading stores...</p>
            </div>
          </div>
        )}

        {/* Stores Table */}
        {!loading && (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
            {/* Table Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">All Stores</h2>
                  <p className="text-gray-500 text-sm mt-1 font-medium">
                    {filteredAndSortedStores.length} store{filteredAndSortedStores.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            {filteredAndSortedStores.length === 0 ? (
              <div className="text-center py-16 px-8">
                <div className="text-5xl mb-4">🏪</div>
                <p className="text-gray-600 text-lg font-medium mb-2">No stores found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or create a new store</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <ResizableTableHeader
                      columns={tableColumns}
                      columnWidths={columnWidths}
                      onMouseDown={handleMouseDown}
                      resizingColumn={resizingColumn}
                    />
                  </thead>
                  <tbody>
                    {filteredAndSortedStores.map((store, index) => {
                      let colIndex = 0;
                      return (
                      <tr
                        key={store.storeId}
                        className={`border-b border-gray-100 transition-all duration-200 group ${
                          index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/50'
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-5" style={{ width: columnWidths[tableColumns[colIndex++].key] }}>
                          <div className="flex items-center gap-3">
                            {store.storeImageUrl && (
                              <img
                                src={store.storeImageUrl}
                                alt={store.name}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                              />
                            )}
                            <div>
                              <p className="text-base font-bold text-gray-900">{store.name}</p>
                              {store.toastLocationId && (
                                <p className="text-xs text-gray-500">Toast: {store.toastLocationId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Type */}
                        <td className="px-6 py-5" style={{ width: columnWidths[tableColumns[colIndex++].key] }}>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                            {store.storeType?.name || 'N/A'}
                          </span>
                        </td>
                        {/* Address */}
                        <td className="px-6 py-5" style={{ width: columnWidths[tableColumns[colIndex++].key] }}>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {store.address || 'No address'}
                            </p>
                            {(store.city || store.state || store.country) && (
                              <p className="text-xs text-gray-600">
                                📍 {[store.city, store.state, store.zipCode].filter(Boolean).join(', ')}
                                {store.country && `, ${store.country}`}
                              </p>
                            )}
                            {store.continent && (
                              <p className="text-xs text-purple-600 font-semibold">
                                🌍 {store.continent}
                              </p>
                            )}
                            {store.timezone && (
                              <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                                ⏰ {store.timezone.split('/')[1].replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-6 py-5" style={{ width: columnWidths[tableColumns[colIndex++].key] }}>
                          <div className="space-y-1">
                            {store.phone && (
                              <p className="text-xs text-gray-600 flex items-center gap-2">
                                <FiPhone size={12} className="text-pink-500" />
                                {store.phone}
                              </p>
                            )}
                            {store.email && (
                              <p className="text-xs text-gray-600 flex items-center gap-2">
                                <FiMail size={12} className="text-pink-500" />
                                {store.email}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-5" style={{ width: columnWidths[tableColumns[colIndex++].key] }}>
                          <div className="space-y-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {store.isActive ? '✓ Active' : 'Inactive'}
                            </span>
                            <br />
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              store.acceptingOrders ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {store.acceptingOrders ? '📦 Orders' : '🚫 No Orders'}
                            </span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-5 text-center" style={{ width: columnWidths[tableColumns[colIndex++].key] }}>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(store)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(store.storeId, store.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-50 to-orange-50 border-b-2 border-pink-100 p-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {editingId ? 'Edit Store' : 'Add New Store'}
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
                  placeholder="e.g., Only Coffee - Downtown Seattle"
                />
              </div>

              {/* Store Type */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Store Type</label>
                <select
                  value={formData.storeTypeId}
                  onChange={(e) => setFormData({ ...formData, storeTypeId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                >
                  <option value="">Select Type</option>
                  {storeTypes.map(type => (
                    <option key={type.storeTypeId} value={type.storeTypeId}>
                      {getStoreTypeName(type.code)} {type.description && `- ${type.description}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address with Autocomplete */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Street Address (with autocomplete)</label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  onSelectSuggestion={handleSelectAddressSuggestion}
                  placeholder="Start typing an address..."
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="e.g., New Orleans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => {
                      const selectedCountry = SORTED_COUNTRIES.find(c => c.code === e.target.value);
                      setFormData({
                        ...formData,
                        countryCode: e.target.value,
                        country: selectedCountry?.name || '',
                        continent: selectedCountry?.continent || '',
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    required
                  >
                    {SORTED_COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional USA Fields */}
              {(formData.countryCode === 'US' || formData.country === 'United States') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                      placeholder="e.g., Louisiana"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                      placeholder="e.g., 70116"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Continent (Auto-populated, Read-only) */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Continent <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.continent}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Auto-populated based on country"
                />
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
                    placeholder="(206) 555-0123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="store@onlycoffee.com"
                  />
                </div>
              </div>

              {/* Toast Location ID and Timezone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Toast Location ID</label>
                  <input
                    type="text"
                    value={formData.toastLocationId}
                    onChange={(e) => setFormData({ ...formData, toastLocationId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="toast_location_001"
                  />
                </div>
                <div className="relative timezone-selector">
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    <FiGlobe className="inline mr-2" />
                    Timezone <span className="text-pink-600">*</span>
                  </label>

                  {/* Searchable Timezone Selector */}
                  <div className="relative">
                    <input
                      type="text"
                      value={timezoneSearch || getTimezoneDisplayName(formData.timezone)}
                      onChange={(e) => {
                        setTimezoneSearch(e.target.value);
                        setShowTimezoneDropdown(true);
                      }}
                      onFocus={() => setShowTimezoneDropdown(true)}
                      placeholder="Search timezones..."
                      className="w-full px-4 py-3 pr-10 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    />
                    <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                    {/* Dropdown */}
                    {showTimezoneDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-pink-100 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                        {/* Popular Timezones */}
                        <div className="p-3 bg-gradient-to-r from-pink-50 to-orange-50 border-b-2 border-pink-100">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">⭐ Popular</p>
                          {WORLD_TIMEZONES.filter(tz => POPULAR_TIMEZONES.includes(tz.value))
                            .filter(tz => !timezoneSearch || tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) || tz.value.toLowerCase().includes(timezoneSearch.toLowerCase()))
                            .map(tz => (
                              <button
                                key={tz.value}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, timezone: tz.value });
                                  setTimezoneSearch('');
                                  setShowTimezoneDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-pink-100 transition-colors ${
                                  formData.timezone === tz.value ? 'bg-pink-200 font-bold' : ''
                                }`}
                              >
                                <p className="text-sm font-semibold text-gray-900">{tz.label}</p>
                                <p className="text-xs text-gray-500">{tz.offset}</p>
                              </button>
                            ))}
                        </div>

                        {/* All Timezones by Region */}
                        {Object.entries(getTimezonesByRegion()).map(([region, timezones]) => {
                          const filteredTimezones = timezones.filter(tz =>
                            !timezoneSearch ||
                            tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
                            tz.value.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
                            region.toLowerCase().includes(timezoneSearch.toLowerCase())
                          );

                          if (filteredTimezones.length === 0) return null;

                          return (
                            <div key={region} className="border-b border-gray-100 last:border-b-0">
                              <p className="px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide bg-gray-50">
                                {region}
                              </p>
                              {filteredTimezones.map(tz => (
                                <button
                                  key={tz.value}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, timezone: tz.value });
                                    setTimezoneSearch('');
                                    setShowTimezoneDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                                    formData.timezone === tz.value ? 'bg-pink-100 font-bold' : ''
                                  }`}
                                >
                                  <p className="text-sm font-semibold text-gray-900">{tz.label}</p>
                                  <p className="text-xs text-gray-500">{tz.offset}</p>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Critical: Store hours will be calculated in this timezone
                  </p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    Selected: {formData.timezone}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  placeholder="Store description..."
                />
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

              {/* Store Hours */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Store Hours</label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                  {formData.storeHours.map((hours, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-24 text-sm font-semibold text-gray-700">{DAYS_OF_WEEK[hours.dayOfWeek]}</span>
                      <input
                        type="time"
                        value={hours.openTime}
                        onChange={(e) => {
                          const newHours = [...formData.storeHours];
                          newHours[index].openTime = e.target.value;
                          setFormData({ ...formData, storeHours: newHours });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={hours.closeTime}
                        onChange={(e) => {
                          const newHours = [...formData.storeHours];
                          newHours[index].closeTime = e.target.value;
                          setFormData({ ...formData, storeHours: newHours });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#ff93a3' }}
                  />
                  <label className="ml-3 text-sm font-bold text-gray-900">Active Store</label>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                  <input
                    type="checkbox"
                    checked={formData.acceptingOrders}
                    onChange={(e) => setFormData({ ...formData, acceptingOrders: e.target.checked })}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#ff93a3' }}
                  />
                  <label className="ml-3 text-sm font-bold text-gray-900">Accepting Orders</label>
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
                      Save Store
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiTrash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">Delete Store?</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteModal.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresManager;

