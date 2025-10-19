import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';

const MenuItemsManager = () => {
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Espresso', category: 'Coffee', price: 3.50, imageUrl: '', stores: [1, 2, 3] },
    { id: 2, name: 'Cappuccino', category: 'Coffee', price: 4.50, imageUrl: '', stores: [1, 2] },
  ]);

  const [stores, setStores] = useState([
    { id: 1, name: 'Downtown' },
    { id: 2, name: 'Uptown' },
    { id: 3, name: 'Airport' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Coffee',
    description: '',
    price: '',
    imageUrl: '',
    stores: [] as number[],
  });

  const handleAddNew = () => {
    setFormData({ name: '', category: 'Coffee', description: '', price: '', imageUrl: '', stores: [] });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      stores: item.stores || [],
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      setMenuItems(menuItems.map(item =>
        item.id === editingId
          ? { ...item, ...formData, price: parseFloat(formData.price) }
          : item
      ));
      toast.success('Menu item updated!');
    } else {
      setMenuItems([...menuItems, {
        id: Math.max(...menuItems.map(i => i.id), 0) + 1,
        ...formData,
        price: parseFloat(formData.price),
      }]);
      toast.success('Menu item created!');
    }
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    toast.success('Menu item deleted');
  };

  const handleStoreToggle = (storeId: number) => {
    setFormData(prev => ({
      ...prev,
      stores: prev.stores.includes(storeId)
        ? prev.stores.filter(s => s !== storeId)
        : [...prev.stores, storeId],
    }));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-2">Manage products, pricing, and store availability</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          style={{ backgroundColor: '#ff93a3' }}
        >
          <FiPlus size={20} />
          Add Menu Item
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., Cappuccino"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option>Coffee</option>
                    <option>Tea</option>
                    <option>Pastry</option>
                    <option>Sandwich</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Item description..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <ImageUploader
                  onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="menu-items"
                />
              </div>

              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Available at Stores</label>
                <div className="space-y-2">
                  {stores.map(store => (
                    <label key={store.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.stores.includes(store.id)}
                        onChange={() => handleStoreToggle(store.id)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#ff93a3' }}
                      />
                      <span className="font-medium text-gray-700">{store.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#ff93a3' }}
                >
                  <FiSave size={18} />
                  Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stores</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-gray-600">{item.category}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">${item.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.stores.length} store(s)</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuItemsManager;

