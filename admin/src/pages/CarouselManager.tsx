import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiSave, FiEye, FiLoader, FiEdit2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import ImageUploader, { ImageUploaderRef } from '../components/ImageUploader';

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
}

const CarouselManager = () => {
  const { isAuthenticated } = useAuthStore();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CarouselImage>>({});
  const imageUploaderRef = useRef<ImageUploaderRef>(null);

  // Fetch carousel images from backend
  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setInitialLoading(true);
        const token = localStorage.getItem('adminToken');

        if (!token) {
          toast.error('Not authenticated. Please login first.');
          setInitialLoading(false);
          return;
        }

        const response = await fetch('http://localhost:3000/api/v1/carousel', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          setInitialLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch carousel images: ${response.statusText}`);
        }

        const data = await response.json();
        setImages(data.data || []);
      } catch (error) {
        console.error('Error fetching carousel images:', error);
        toast.error('Failed to load carousel images');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCarouselImages();
    }
  }, [isAuthenticated]);

  const handleAddImage = (url: string) => {
    if (images.length >= 5) {
      toast.error('Maximum 5 carousel images allowed');
      return;
    }
    // Find the next available position (0-4)
    const usedPositions = new Set(images.map(img => img.position));
    let nextPosition = 0;
    while (usedPositions.has(nextPosition) && nextPosition < 5) {
      nextPosition++;
    }

    const newImage: CarouselImage = {
      id: `temp-${Date.now()}`,
      imageUrl: url,
      title: `Carousel Image ${images.length + 1}`,
      position: nextPosition,
      isActive: true,
      displayDuration: 3,
    };
    setImages([...images, newImage]);
    toast.success('Image added to carousel!');
  };

  const handleRemoveImage = async (id: string) => {
    if (images.length <= 1) {
      toast.error('Carousel must have at least one image');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3000/api/v1/carousel/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete carousel image');
      }

      setImages(images.filter(img => img.id !== id));
      toast.success('Image removed from carousel');
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      toast.error('Failed to delete carousel image');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setImages(images.map(img => img.id === id ? { ...img, title } : img));
  };

  const handleEditImage = (image: CarouselImage) => {
    setEditingImage(image);
    setEditFormData({ ...image });
  };

  const handleCloseEditModal = () => {
    setEditingImage(null);
    setEditFormData({});
  };

  const handleEditFormChange = (field: keyof CarouselImage, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Only send allowed fields for update
      const updatePayload = {
        title: editFormData.title,
        description: editFormData.description,
        imageUrl: editFormData.imageUrl,
        position: editFormData.position,
        displayDuration: editFormData.displayDuration,
        targetMenuItemId: editFormData.targetMenuItemId,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        isActive: editFormData.isActive,
      };

      const response = await fetch(`http://localhost:3000/api/v1/carousel/${editingImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to update carousel image');
      }

      // Update the image in the local state
      setImages(images.map(img => img.id === editingImage.id ? { ...img, ...updatePayload } : img));
      toast.success('Carousel image updated successfully!');
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating carousel image:', error);
      toast.error('Failed to update carousel image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');

      // Save each image that has been modified or is new
      for (const image of images) {
        if (image.id.startsWith('temp-')) {
          // Validate required fields for new images
          if (!image.title || !image.title.trim()) {
            toast.error('Title is required for new carousel images');
            setLoading(false);
            return;
          }
          if (!image.imageUrl) {
            toast.error('Image is required for new carousel images');
            setLoading(false);
            return;
          }

          // Create new carousel image - only send allowed fields
          const payload = {
            title: image.title,
            description: image.description,
            imageUrl: image.imageUrl,
            position: image.position,
            displayDuration: image.displayDuration,
            targetMenuItemId: image.targetMenuItemId,
            startDate: image.startDate,
            endDate: image.endDate,
            isActive: image.isActive,
          };

          const response = await fetch('http://localhost:3000/api/v1/carousel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.message || 'Failed to create carousel image');
          }
        } else {
          // Update existing carousel image
          const response = await fetch(`http://localhost:3000/api/v1/carousel/${image.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: image.title,
              description: image.description,
              imageUrl: image.imageUrl,
              position: image.position,
              displayDuration: image.displayDuration,
              targetUrl: image.targetUrl,
              targetMenuItemId: image.targetMenuItemId,
              startDate: image.startDate,
              endDate: image.endDate,
            }),
          });

          if (!response.ok) throw new Error('Failed to update carousel image');
        }
      }

      toast.success('Carousel updated successfully!');
      // Reset the image uploader
      imageUploaderRef.current?.reset();
      // Refresh the carousel images
      const response = await fetch('http://localhost:3000/api/v1/carousel', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setImages(data.data || []);
      }
    } catch (error) {
      console.error('Error saving carousel:', error);
      toast.error('Failed to save carousel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 p-8">
      {/* Header */}
      <div className="mb-12 max-w-6xl mx-auto">
        <div className="inline-block mb-4">
          <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">Content Management</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
          Carousel Manager
        </h1>
        <p className="text-gray-600 text-lg">Manage the 5 promotional images displayed on the home screen</p>
      </div>

      {initialLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FiLoader className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#ff93a3' }} />
            <p className="text-gray-600">Loading carousel images...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          {/* Images List */}
          <div>
            <div className="bg-white rounded-3xl p-8 border-2 border-pink-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Carousel Images</h2>
                  <p className="text-sm text-gray-600 mt-1">{images.length} of 5 images</p>
                </div>
                {images.length < 5 && (
                  <div className="w-full max-w-xs">
                    <ImageUploader ref={imageUploaderRef} onUpload={handleAddImage} folder="promotions" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {images.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No carousel images yet. Add one to get started!</p>
                  </div>
                ) : (
                  images.map((image, index) => (
                    <div key={image.id} className="flex items-center gap-4 p-4 border-2 border-pink-100 rounded-2xl hover:border-pink-300 hover:bg-pink-50/30 transition-all min-w-0">
                      <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                        <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={image.title}
                          onChange={(e) => handleUpdateTitle(image.id, e.target.value)}
                          className="w-full px-4 py-2 border-2 border-pink-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                          placeholder="Image title"
                        />
                        <p className="text-xs text-gray-500 mt-2 truncate">{image.imageUrl}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-orange-500 px-3 py-1 rounded-full">#{index + 1}</span>
                        <button
                          onClick={() => handleEditImage(image)}
                          className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex-shrink-0"
                          title="Edit image"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        {(image.viewCount === undefined || image.viewCount === 0) && (
                          <button
                            onClick={() => handleRemoveImage(image.id)}
                            className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex-shrink-0"
                            title="Delete image"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full mt-8 py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#ff93a3' }}
              >
                <FiSave size={20} />
                {loading ? 'Saving...' : 'Save Carousel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Edit Carousel Image</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Image Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Image Preview</label>
                <div className="w-full h-48 rounded-2xl overflow-hidden bg-gray-100 border-2 border-pink-100 flex items-center justify-center">
                  <img
                    src={editFormData.imageUrl || editingImage.imageUrl}
                    alt={editFormData.title || editingImage.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Image title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  placeholder="Image description"
                  rows={3}
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  value={editFormData.imageUrl || ''}
                  onChange={(e) => handleEditFormChange('imageUrl', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* Display Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Duration (seconds)</label>
                <input
                  type="number"
                  value={editFormData.displayDuration || 3}
                  onChange={(e) => handleEditFormChange('displayDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="1"
                  max="30"
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive !== false}
                    onChange={(e) => handleEditFormChange('isActive', e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#ff93a3' }}
                  />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseEditModal}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#ff93a3' }}
                >
                  {loading ? (
                    <>
                      <FiLoader size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselManager;

