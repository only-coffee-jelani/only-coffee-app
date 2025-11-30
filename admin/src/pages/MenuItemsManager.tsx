import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiLoader, FiImage, FiSearch, FiFilter, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../config';

const MenuItemsManager = () => {
  const { user } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const allergensDropdownRef = useRef<HTMLDivElement>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [allergens, setAllergens] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, string>>(new Map()); // categoryName -> categoryId
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'best_sellers', // Keep for backward compatibility
    categories: ['best_sellers'] as string[], // New multi-category field
    description: '',
    basePrice: '',
    imageUrl: '',
    selectedStores: [] as string[],
    allergens: [] as string[],
  });



  const [showAllergensDropdown, setShowAllergensDropdown] = useState(false);

  // Fetch menu items and stores from backend
  useEffect(() => {
    fetchData();
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStoresDropdown(false);
      }
      if (allergensDropdownRef.current && !allergensDropdownRef.current.contains(event.target as Node)) {
        setShowAllergensDropdown(false);
      }
    };

    if (showStoresDropdown || showAllergensDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStoresDropdown, showAllergensDropdown]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuResponse, storesResponse, categoriesResponse, allergensResponse] = await Promise.all([
        fetch(`${API_BASE}/menu-items`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE}/stores`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE}/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE}/allergens`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (!menuResponse.ok) {
        throw new Error(`Failed to fetch menu items: ${menuResponse.status}`);
      }
      if (!storesResponse.ok) throw new Error('Failed to fetch stores');
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
      if (!allergensResponse.ok) throw new Error('Failed to fetch allergens');

      const menuData = await menuResponse.json();
      const storesResult = await storesResponse.json();
      const categoriesData = await categoriesResponse.json();
      const allergensData = await allergensResponse.json();

      // Handle menu items - backend returns array directly
      const items = Array.isArray(menuData) ? menuData : (menuData.data || []);
      setMenuItems(items);

      // Backend returns {success, data, count} format for stores
      // Transform stores to have consistent id and type fields
      const transformedStores = (storesResult.data || []).map((store: any) => ({
        ...store,
        id: store.storeId || store.id,
        type: store.storeType?.code || store.type || 'coffee_shop',
      }));
      setStores(transformedStores);

      // Allergens - handle both array and object with value property
      const allergensList = Array.isArray(allergensData)
        ? allergensData
        : (allergensData.value || allergensData.data || []);
      setAllergens(allergensList);

      // Categories - handle both array and object with data property
      const cats = Array.isArray(categoriesData)
        ? categoriesData
        : (categoriesData.data || []);
      setCategories(cats.map((c: any) => c.name || c));

      // Create a map of categoryName -> categoryId for easy lookup
      const catMap = new Map<string, string>();
      cats.forEach((cat: any) => {
        if (cat.name && cat.categoryId) {
          catMap.set(cat.name, cat.categoryId);
        }
      });
      setCategoriesMap(catMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to load menu items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      category: 'best_sellers',
      categories: ['best_sellers'],
      description: '',
      basePrice: '',
      imageUrl: '',
      selectedStores: [],
      allergens: [],
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    // Use the storeIds array directly from the item
    const storesWithItem = item.storeIds || [];

    // Use the allergenIds array directly from the item
    const allergensWithItem = item.allergenIds || [];

    // Get the category name from the item
    const categoryName = item.categoryName || '';

    setFormData({
      name: item.name || '',
      category: categoryName,
      categories: categoryName ? [categoryName] : [],
      description: item.description || '',
      basePrice: item.basePrice ? item.basePrice.toString() : '',
      imageUrl: item.imageUrl || '',
      selectedStores: storesWithItem,
      allergens: allergensWithItem,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.basePrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (formData.selectedStores.length === 0) {
      toast.error('Please select at least one store');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        toast.error('You are not logged in. Please log in first.');
        return;
      }

      // Get the categoryId from the category name
      const categoryName = formData.categories[0] || formData.category;
      const categoryId = categoriesMap.get(categoryName);

      if (!categoryId) {
        toast.error('Invalid category selected');
        setSaving(false);
        return;
      }

      // Build the payload according to the backend schema
      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        basePrice: parseFloat(formData.basePrice),
        categoryId: categoryId,
        storeIds: formData.selectedStores, // Include store associations
        allergenIds: formData.allergens, // Include allergen associations
      };

      // Only include optional fields if they have values
      if (formData.imageUrl) {
        payload.imageUrl = formData.imageUrl;
      }

      if (editingId) {
        // Update existing menu item with new storeIds
        const response = await fetch(`${API_BASE}/menu-items/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('adminToken');
            toast.error('Your session has expired. Please log in again.');
            window.location.href = '/login';
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to update menu item: ${response.status}`);
        }

        const updatedItem = await response.json();
        setMenuItems(menuItems.map(item => item.id === editingId ? updatedItem : item));
        toast.success('Menu item updated successfully!');
      } else {
        // Create new menu item with selected stores
        const response = await fetch(`${API_BASE}/menu-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('adminToken');
            toast.error('Your session has expired. Please log in again.');
            window.location.href = '/login';
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to create menu item: ${response.status}`);
        }

        const newItem = await response.json();
        setMenuItems([newItem, ...menuItems]);
        toast.success('Menu item created successfully!');
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ show: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/menu-items/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete menu item');

      setMenuItems(menuItems.filter(item => item.id !== deleteModal.id));
      setDeleteModal({ show: false, id: null, name: '' });
      toast.success('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'best_sellers': 'Best Sellers',
      'seasonal_specials': 'Seasonal Specials',
      'signature': 'Signature',
      'hot_coffee': 'Hot Coffee',
      'iced_coffee': 'Iced Coffee',
      'cold_brew': 'Cold Brew',
      'other_drinks': 'Other Drinks',
      'chocolate': 'Other Drinks', // Legacy support
      'ice_cream': 'Ice Cream',
      'add_ons': 'Add Ons',
    };
    return labels[category] || category;
  };

  // Filter and sort logic
  const filteredAndSortedItems = useMemo(() => {
    let filtered = menuItems.filter(item => {
      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter - use categoryName from backend
      const matchesCategory = selectedCategory === 'all' || item.categoryName === selectedCategory;

      // Price range filter
      const price = Number(item.basePrice);
      const matchesPrice = price >= priceRange.min && price <= priceRange.max;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'price':
          compareValue = Number(a.basePrice) - Number(b.basePrice);
          break;
        case 'category':
          compareValue = (a.categoryName || '').localeCompare(b.categoryName || '');
          break;
        case 'newest':
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [menuItems, searchTerm, selectedCategory, priceRange, sortBy, sortOrder]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    filteredAndSortedItems.forEach(item => {
      const categoryKey = item.categoryName || 'Uncategorized';
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(item);
    });

    return grouped;
  }, [filteredAndSortedItems]);

  // Get all categories from the grouped items (dynamically)
  const allCategories = useMemo(() => {
    return Object.keys(itemsByCategory).sort();
  }, [itemsByCategory]);

  // Group stores by type (dynamically)
  const storesByType = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    stores.forEach(store => {
      const type = store.type || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(store);
    });
    return grouped;
  }, [stores]);

  // Get all store types
  const storeTypes = useMemo(() => {
    return Object.keys(storesByType);
  }, [storesByType]);

  // Handle check all stores
  const handleCheckAllStores = (type: string) => {
    if (type === 'all') {
      setFormData({
        ...formData,
        selectedStores: stores.map(s => s.id),
      });
    } else {
      // Get IDs of stores of this type
      const typeIds = (storesByType[type] || []).map(s => s.id);
      // Keep IDs of stores of other types
      const otherIds = formData.selectedStores.filter(id =>
        !typeIds.includes(id)
      );
      setFormData({
        ...formData,
        selectedStores: [...typeIds, ...otherIds],
      });
    }
  };

  // Handle uncheck all stores
  const handleUncheckAllStores = (type: string) => {
    if (type === 'all') {
      setFormData({
        ...formData,
        selectedStores: [],
      });
    } else {
      // Remove IDs of stores of this type
      const typeIds = (storesByType[type] || []).map(s => s.id);
      setFormData({
        ...formData,
        selectedStores: formData.selectedStores.filter(id =>
          !typeIds.includes(id)
        ),
      });
    }
  };

  // Check if all stores of a type are selected
  const areAllStoresSelected = (type: string) => {
    const storesOfType = storesByType[type] || [];
    return storesOfType.length > 0 && storesOfType.every(s => formData.selectedStores.includes(s.id));
  };

  const areAllStoresSelectedGlobally = stores.length > 0 && stores.every(s => formData.selectedStores.includes(s.id));

  // Category management functions
  const handleAddCategory = async () => {
    const categoryKey = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    const displayName = newCategoryName.trim().split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    if (!categoryKey) {
      toast.error('Please enter a category name');
      return;
    }
    if (categories.includes(categoryKey)) {
      toast.error('Category already exists');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: categoryKey, displayName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create category');
      }

      setCategories([...categories, categoryKey]);
      setNewCategoryName('');
      toast.success('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    // Check if any items use this category
    const itemsUsingCategory = menuItems.filter(item =>
      (item.categories && item.categories.includes(category)) || item.category === category
    );

    if (itemsUsingCategory.length > 0) {
      toast.error(`Cannot delete category "${category}". ${itemsUsingCategory.length} item(s) are using it.`);
      return;
    }

    try {
      // Find the category ID by name
      const categoriesResponse = await fetch(`${API_BASE}/categories`);
      const categoriesData = await categoriesResponse.json();
      const categoryObj = categoriesData.find((c: any) => c.name === category);

      if (!categoryObj) {
        toast.error('Category not found');
        return;
      }

      const response = await fetch(`${API_BASE}/categories/${categoryObj.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
      }

      setCategories(categories.filter(c => c !== category));
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Menu Items</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage products, pricing, and availability across all stores</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 text-pink-600 font-bold rounded-xl transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2 bg-white border-2 border-pink-200 hover:bg-pink-50"
            >
              <FiFilter size={18} />
              Manage Categories
            </button>
            <button
              onClick={handleAddNew}
              className="px-6 py-3 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: '#ff93a3' }}
            >
              <FiPlus size={18} />
              Add Menu Item
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-50 to-orange-50 border-b-2 border-pink-100 p-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  placeholder="e.g., Cappuccino"
                />
              </div>

              {/* Categories & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Categories * (Select all that apply)</label>
                  <div className="border-2 border-pink-100 rounded-xl p-3 bg-white max-h-60 overflow-y-auto">
                    {(categories.length > 0 ? categories : [
                      'best_sellers',
                      'seasonal_specials',
                      'signature',
                      'hot_coffee',
                      'iced_coffee',
                      'cold_brew',
                      'other_drinks',
                      'ice_cream',
                      'add_ons'
                    ]).map((category) => (
                      <label key={category} className="flex items-center gap-2 py-2 hover:bg-pink-50 px-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, categories: [...formData.categories, category] });
                            } else {
                              setFormData({ ...formData, categories: formData.categories.filter(c => c !== category) });
                            }
                          }}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{getCategoryLabel(category)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="0.00"
                  />
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
                  placeholder="Item description..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Product Image</label>
                <ImageUploader
                  onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="menu-items"
                  imageUrl={formData.imageUrl}
                />
              </div>

              {/* Allergens */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Allergens</label>

                {/* Dropdown Checkbox */}
                <div className="relative" ref={allergensDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowAllergensDropdown(!showAllergensDropdown)}
                    className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl bg-white text-left font-semibold text-gray-900 hover:bg-orange-50 transition-colors flex items-center justify-between"
                  >
                    <span>
                      {formData.allergens.length === 0
                        ? 'Select allergens...'
                        : formData.allergens.length === allergens.length
                        ? 'All allergens selected'
                        : `${formData.allergens.length} allergen${formData.allergens.length !== 1 ? 's' : ''} selected`}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform ${showAllergensDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showAllergensDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-300 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                      {/* Check All Option */}
                      <div className="p-4 border-b-2 border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50 sticky top-0">
                        <label className="flex items-center gap-3 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.allergens.length === allergens.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  allergens: allergens.map(a => a.id),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  allergens: [],
                                });
                              }
                            }}
                            className="w-5 h-5 rounded border-2 border-orange-300 cursor-pointer accent-orange-500"
                          />
                          <span className="font-bold text-gray-900">Check All</span>
                        </label>
                      </div>

                      {/* Allergens List */}
                      <div className="p-4 space-y-2">
                        {allergens.map(allergen => (
                          <label key={allergen.id} className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.allergens.includes(allergen.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    allergens: [...formData.allergens, allergen.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    allergens: formData.allergens.filter(a => a !== allergen.id),
                                  });
                                }
                              }}
                              className="w-4 h-4 rounded border-2 border-orange-300 cursor-pointer accent-orange-500"
                            />
                            <span className="text-sm text-gray-900">{allergen.icon} {allergen.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Stores */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Available At Stores</label>

                {/* Dropdown Checkbox */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowStoresDropdown(!showStoresDropdown)}
                    className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl bg-white text-left font-semibold text-gray-900 hover:bg-pink-50 transition-colors flex items-center justify-between"
                  >
                    <span>
                      {formData.selectedStores.length === 0
                        ? 'Select stores...'
                        : formData.selectedStores.length === stores.length
                        ? 'All stores selected'
                        : `${formData.selectedStores.length} store${formData.selectedStores.length !== 1 ? 's' : ''} selected`}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform ${showStoresDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showStoresDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-pink-300 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                      {/* Check All Options */}
                      <div className="p-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-orange-50 sticky top-0">
                        <div className="space-y-3">
                          {/* Check All */}
                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={areAllStoresSelectedGlobally}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleCheckAllStores('all');
                                } else {
                                  handleUncheckAllStores('all');
                                }
                              }}
                              className="w-5 h-5 rounded border-2 border-pink-300 cursor-pointer accent-pink-500"
                            />
                            <span className="font-bold text-gray-900">Check All</span>
                          </label>

                          {/* Check All by Store Type */}
                          {storeTypes.map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={areAllStoresSelected(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleCheckAllStores(type);
                                  } else {
                                    handleUncheckAllStores(type);
                                  }
                                }}
                                className="w-5 h-5 rounded border-2 border-pink-300 cursor-pointer accent-pink-500"
                              />
                              <span className="font-bold text-gray-900 capitalize">
                                All {type.replace(/_/g, ' ')}s ({storesByType[type].length})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Stores List */}
                      <div className="p-4 space-y-4">
                        {storeTypes.map(type => (
                          <div key={type}>
                            <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                              {type.replace(/_/g, ' ')}s
                            </h4>
                            <div className="space-y-2 pl-4 border-l-4 border-pink-300">
                              {storesByType[type].map(store => (
                                <label key={store.id} className="flex items-center gap-3 cursor-pointer hover:bg-pink-50 p-2 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.selectedStores.includes(store.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selectedStores: [...formData.selectedStores, store.id],
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          selectedStores: formData.selectedStores.filter(id => id !== store.id),
                                        });
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-2 border-pink-300 cursor-pointer accent-pink-500"
                                  />
                                  <span className="text-sm text-gray-900">{store.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                      Save Item
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
            <p className="text-gray-600 font-semibold">Loading menu items...</p>
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Section */}
      {!loading && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-md hover:shadow-lg transition-shadow">
            {/* Search Bar */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">🔍 Search Items</label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
                />
              </div>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">📂 Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-all"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">💰 Price Range ($)</label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      placeholder="Min"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    />
                  </div>
                  <span className="text-gray-400 font-bold pb-3">–</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
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
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="category">Category</option>
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
                Showing <span className="text-pink-600 font-bold">{filteredAndSortedItems.length}</span> of <span className="text-pink-600 font-bold">{menuItems.length}</span> items
              </p>
              {(searchTerm || selectedCategory !== 'all' || priceRange.min > 0 || priceRange.max < 100 || sortBy !== 'newest') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange({ min: 0, max: 100 });
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

      {/* Menu Items by Category */}
      {!loading && (
        <div className="max-w-6xl mx-auto">
          {menuItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-md">
              <div className="text-5xl mb-4">☕</div>
              <p className="text-gray-600 text-lg font-medium mb-2">No menu items yet</p>
              <p className="text-gray-500 text-sm">Create your first menu item to get started</p>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-md">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600 text-lg font-medium mb-2">No items match your filters</p>
              <p className="text-gray-500 text-sm">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="space-y-8">
              {allCategories.map(category => {
                const items = itemsByCategory[category] || [];
                if (items.length === 0) return null;

                return (
                  <div key={category} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    {/* Category Header */}
                    <div className="bg-white px-8 py-6 border-b border-gray-200">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{getCategoryLabel(category)}</h2>
                        <p className="text-gray-500 text-sm mt-1 font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Category Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">Image</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-48">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Price</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">Calories</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-64">Description</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr
                              key={item.id}
                              className={`border-b border-gray-100 transition-all duration-200 group ${
                                index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/50'
                              }`}
                            >
                              {/* Image */}
                              <td className="px-6 py-5">
                                {item.imageUrl ? (
                                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-md group-hover:shadow-lg transition-all">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 shadow-md group-hover:shadow-lg transition-all">
                                    <FiImage size={24} />
                                  </div>
                                )}
                              </td>

                              {/* Name */}
                              <td className="px-6 py-5">
                                <p className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">{item.name}</p>
                              </td>

                              {/* Category */}
                              <td className="px-6 py-5">
                                <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-bold shadow-sm group-hover:shadow-md transition-shadow">
                                  {item.categoryName || 'Uncategorized'}
                                </span>
                              </td>

                              {/* Price */}
                              <td className="px-6 py-5">
                                <span className="inline-block px-4 py-2 bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 rounded-full text-base font-bold shadow-sm group-hover:shadow-md transition-shadow">
                                  ${Number(item.basePrice).toFixed(2)}
                                </span>
                              </td>

                              {/* Calories */}
                              <td className="px-6 py-5">
                                {item.calories ? (
                                  <span className="text-sm text-gray-700 font-semibold">
                                    {item.calories} cal
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">N/A</span>
                                )}
                              </td>

                              {/* Description */}
                              <td className="px-6 py-5">
                                <p className="text-sm text-gray-700 line-clamp-2 group-hover:text-gray-900 transition-colors font-medium">
                                  {item.description || <span className="text-gray-400 italic">No description</span>}
                                </p>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-5">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all hover:shadow-md active:scale-95"
                                    title="Edit"
                                  >
                                    <FiEdit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, item.name)}
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
                  </div>
                );
              })}
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
              <h2 className="text-2xl font-bold text-white">Delete Menu Item?</h2>
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
                This action cannot be undone. The menu item will be permanently removed from all stores.
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
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg hover:shadow-xl"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 border-b-2 border-pink-100 p-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Manage Categories
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Add New Category */}
              <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Add New Category
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="e.g., Special Drinks"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95"
                  >
                    <FiPlus size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Category will be saved as: {newCategoryName.trim().toLowerCase().replace(/\s+/g, '_') || '...'}</p>
              </div>

              {/* Existing Categories */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Existing Categories ({categories.length})
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <FiFilter size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No categories yet. Add one above!</p>
                    </div>
                  ) : (
                    categories.map((category) => {
                      const itemCount = menuItems.filter(item =>
                        (item.categories && item.categories.includes(category)) || item.category === category
                      ).length;
                      return (
                        <div key={category} className="flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-pink-200 transition-all group">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 capitalize">
                              {category.split('_').join(' ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete category"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Categories are automatically saved when you assign them to menu items. You can create categories on-the-fly when editing items!
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MenuItemsManager;

