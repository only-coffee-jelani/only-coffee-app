import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiMail, FiX, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';

const StoresManager = () => {
  const [stores, setStores] = useState([
    { id: 1, name: 'Downtown', address: '123 Main St', city: 'New Orleans', phone: '(504) 123-4567', email: 'downtown@onlycoffee.us', imageUrl: '', isActive: true },
    { id: 2, name: 'Uptown', address: '456 Oak Ave', city: 'New Orleans', phone: '(504) 234-5678', email: 'uptown@onlycoffee.us', imageUrl: '', isActive: true },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: 'LA',
    zipCode: '',
    phone: '',
    email: '',
    imageUrl: '',
    isActive: true,
  });

  const handleAddNew = () => {
    setFormData({ name: '', address: '', city: '', state: 'LA', zipCode: '', phone: '', email: '', imageUrl: '', isActive: true });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (store: any) => {
    setFormData(store);
    setEditingId(store.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      setStores(stores.map(s => s.id === editingId ? { ...s, ...formData } : s));
      toast.success('Store updated!');
    } else {
      setStores([...stores, { id: Math.max(...stores.map(s => s.id), 0) + 1, ...formData }]);
      toast.success('Store created!');
    }
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    setStores(stores.filter(s => s.id !== id));
    toast.success('Store deleted');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Locations</h1>
          <p className="text-gray-600 mt-2">Manage all Only Coffee store locations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          style={{ backgroundColor: '#ff93a3' }}
        >
          <FiPlus size={20} />
          Add Store
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Store' : 'Add Store'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., Downtown"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Store Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Image</label>
                <ImageUploader
                  onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="stores"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#ff93a3' }}
                />
                <label className="ml-3 text-sm font-medium text-gray-700">Active</label>
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
                  Save Store
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <div key={store.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Store Image */}
            {store.imageUrl && (
              <div className="h-40 bg-gray-100 overflow-hidden">
                <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Store Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="flex items-center gap-2">
                  <FiMapPin size={16} />
                  {store.address}, {store.city}, {store.state} {store.zipCode}
                </p>
                {store.phone && (
                  <p className="flex items-center gap-2">
                    <FiPhone size={16} />
                    {store.phone}
                  </p>
                )}
                {store.email && (
                  <p className="flex items-center gap-2">
                    <FiMail size={16} />
                    {store.email}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(store)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <FiEdit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoresManager;

