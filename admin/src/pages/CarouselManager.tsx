import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2, FiSave, FiLoader, FiEdit2, FiX, FiImage, FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import ImageUploader from '../components/ImageUploader';

interface CarouselImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  position: number;
  isActive: boolean;
  displayDuration: number;
  targetMenuItemId?: string;
  startDate?: string;
  endDate?: string;
  viewCount?: number;
  createdAt?: string;
}

const API_BASE = 'http://localhost:3000/api/v1';

const CarouselManager = () => {
  const { user } = useAuthStore();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; title: string }>({ show: false, id: null, title: '' });

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'position'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    displayDuration: 3,
    position: 0,
    targetMenuItemId: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  const fetchCarouselImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/carousel`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch carousel images');

      const data = await response.json();
      setImages(data.data || []);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      toast.error('Failed to load carousel images');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort carousel images
  const filteredAndSortedImages = useMemo(() => {
    let filtered = images.filter(image => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = image.title.toLowerCase().includes(searchLower) ||
        (image.description && image.description.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && image.isActive) ||
        (statusFilter === 'inactive' && !image.isActive);

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'position':
          compareValue = a.position - b.position;
          break;
        case 'oldest':
          compareValue = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'newest':
        default:
          compareValue = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [images, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      displayDuration: 3,
      position: images.length,
      targetMenuItemId: '',
      startDate: '',
      endDate: '',
      isActive: false,
    });
    setShowForm(true);
  };

  const handleEdit = (image: CarouselImage) => {
    setEditingId(image.id);
    setFormData({
      title: image.title,
      description: image.description || '',
      imageUrl: image.imageUrl,
      displayDuration: image.displayDuration,
      position: image.position,
      targetMenuItemId: image.targetMenuItemId || '',
      startDate: image.startDate || '',
      endDate: image.endDate || '',
      isActive: image.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, title: string) => {
    setDeleteModal({ show: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/carousel/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');

      await fetchCarouselImages();
      toast.success('Carousel image deleted!');
      setDeleteModal({ show: false, id: null, title: '' });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete carousel image');
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
      const dataToSave = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      const url = editingId
        ? `${API_BASE}/carousel/${editingId}`
        : `${API_BASE}/carousel`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) throw new Error('Failed to save');

      await fetchCarouselImages();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        displayDuration: 3,
        position: 0,
        targetMenuItemId: '',
        startDate: '',
        endDate: '',
        isActive: false,
      });
      toast.success(editingId ? 'Carousel image updated!' : 'Carousel image created!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save carousel image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Carousel Images</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage promotional carousel images for your app</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddNew}
              className="px-6 py-3 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: '#ff93a3' }}
            >
              <FiPlus size={18} />
              Add Carousel Image
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
                  <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Carousel Image' : 'Create New Carousel Image'}</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Form Content */}
              <form className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Image</label>
                  <ImageUploader
                    onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                    folder="carousel"
                  />
                  {formData.imageUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden bg-gray-100 h-48 flex items-center justify-center">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="Carousel image title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white resize-none"
                    placeholder="Image description"
                    rows={3}
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    min="0"
                    max="4"
                  />
                </div>

                {/* Display Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Display Duration (seconds)</label>
                  <input
                    type="number"
                    value={formData.displayDuration}
                    onChange={(e) => setFormData({ ...formData, displayDuration: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    min="1"
                    max="30"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  />
                </div>

                {/* Active Toggle */}
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

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t-2 border-pink-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                    className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl font-bold text-gray-700 hover:bg-pink-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
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
              <p className="text-gray-600 font-semibold">Loading carousel images...</p>
            </div>
          </div>
        )}

        {/* Carousel Images Table */}
        {!loading && (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-all">
            {images.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎠</div>
                <p className="text-gray-600 text-lg font-medium mb-2">No carousel images yet</p>
                <p className="text-gray-500 text-sm">Create your first carousel image to get started</p>
              </div>
            ) : filteredAndSortedImages.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg font-medium mb-2">No carousel images match your filters</p>
                <p className="text-gray-500 text-sm">Try adjusting your search criteria or filters</p>
              </div>
            ) : (
              <>
                {/* Table Header Section */}
                <div className="px-8 py-6 border-b border-gray-200 bg-white">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">All Carousel Images</h3>
                  <p className="text-sm text-gray-600">{filteredAndSortedImages.length} carousel image{filteredAndSortedImages.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Position</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">Image</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-48">Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedImages.map((image, index) => (
                        <tr
                          key={image.id}
                          className={`border-b border-gray-100 transition-all duration-200 group ${
                            index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/50'
                          }`}
                        >
                          <td className="px-6 py-5">
                            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-lg font-bold">
                              #{image.position + 1}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {image.imageUrl ? (
                              <div className="h-16 w-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-md group-hover:shadow-lg transition-all cursor-pointer" onClick={() => setShowFullImage(image.imageUrl)}>
                                <img
                                  src={image.imageUrl}
                                  alt={image.title}
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
                            <p className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">{image.title}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full text-sm font-bold">
                              {image.displayDuration}s
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {image.isActive ? (
                              <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 text-green-800 rounded-full text-sm font-bold border border-green-200 flex items-center gap-2 w-fit">
                                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                                Active
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
                                onClick={() => handleEdit(image)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(image.id, image.title)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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

      {/* Full Image Viewer Modal */}
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
              alt="Full Size Carousel Image"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
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
              <h2 className="text-2xl font-bold text-white">Delete Carousel Image?</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-gray-600 text-center mb-2">
                You're about to delete:
              </p>
              <p className="text-center text-lg font-bold text-gray-900 mb-6 px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                "{deleteModal.title}"
              </p>
              <p className="text-gray-500 text-sm text-center">
                This action cannot be undone. The carousel image will be permanently removed.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, title: '' })}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <FiLoader size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={18} />
                    Delete Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselManager;

