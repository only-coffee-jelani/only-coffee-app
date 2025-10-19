import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiSave, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';

const CarouselManager = () => {
  const [images, setImages] = useState([
    { id: 1, url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch.webp', title: 'Waffolino Launch' },
    { id: 2, url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch-v2.webp', title: 'Waffolino v2' },
    { id: 3, url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch-v3.webp', title: 'Waffolino v3' },
    { id: 4, url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/share-drink-promo.webp', title: 'Share Drink' },
    { id: 5, url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/welcome-card.webp', title: 'Welcome' },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAddImage = (url: string) => {
    const newImage = {
      id: Math.max(...images.map(img => img.id), 0) + 1,
      url,
      title: `Carousel Image ${images.length + 1}`,
    };
    setImages([...images, newImage]);
    toast.success('Image added to carousel!');
  };

  const handleRemoveImage = (id: number) => {
    if (images.length <= 1) {
      toast.error('Carousel must have at least one image');
      return;
    }
    setImages(images.filter(img => img.id !== id));
    toast.success('Image removed from carousel');
  };

  const handleUpdateTitle = (id: number, title: string) => {
    setImages(images.map(img => img.id === id ? { ...img, title } : img));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/promotions/carousel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success('Carousel updated successfully!');
    } catch (error) {
      toast.error('Failed to save carousel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Carousel Manager</h1>
        <p className="text-gray-600 mt-2">Manage the 5 promotional images on the home screen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Images List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Carousel Images ({images.length}/5)</h2>
              {images.length < 5 && (
                <div className="w-full max-w-xs">
                  <ImageUploader onUpload={handleAddImage} folder="promotions" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {images.map((image, index) => (
                <div key={image.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                    <img src={image.url} alt={image.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={image.title}
                      onChange={(e) => handleUpdateTitle(image.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-2 truncate">{image.url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">#{index + 1}</span>
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: '#ff93a3' }}
            >
              <FiSave size={20} />
              {loading ? 'Saving...' : 'Save Carousel'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiEye size={20} />
              Preview
            </h3>

            {images.length > 0 && (
              <>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video mb-4">
                  <img
                    src={images[currentIndex].url}
                    alt={images[currentIndex].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className="w-2 h-2 rounded-full transition-colors"
                        style={{
                          backgroundColor: idx === currentIndex ? '#ff93a3' : '#ccc',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-gray-700">Title:</span> {images[currentIndex].title}</p>
                  <p><span className="font-semibold text-gray-700">Position:</span> {currentIndex + 1} of {images.length}</p>
                  <p className="text-xs text-gray-500 break-all">{images[currentIndex].url}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                    disabled={currentIndex === images.length - 1}
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselManager;

