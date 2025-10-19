import React, { useState } from 'react';
import { FiTrash2, FiCopy, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ImagesManager = () => {
  const [images, setImages] = useState([
    { id: 1, name: 'waffolino-launch-v3.webp', url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch-v3.webp', type: 'Splash Screen', size: '2.4 MB', uploaded: '2025-10-15' },
    { id: 2, name: 'invite-hero-v5.webp', url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/invite-hero-v5.webp', type: 'Carousel', size: '1.8 MB', uploaded: '2025-10-14' },
    { id: 3, name: 'order-now-card.webp', url: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/order-now-card.webp', type: 'Quick Action', size: '1.2 MB', uploaded: '2025-10-13' },
  ]);

  const [filter, setFilter] = useState('All');

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const handleDelete = (id: number) => {
    setImages(images.filter(img => img.id !== id));
    toast.success('Image deleted');
  };

  const filteredImages = filter === 'All' ? images : images.filter(img => img.type === filter);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Images Manager</h1>
        <p className="text-gray-600 mt-2">View and manage all S3 bucket images</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['All', 'Splash Screen', 'Carousel', 'Quick Action', 'Menu Items', 'Stores'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === type
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
            }`}
            style={filter === type ? { backgroundColor: '#ff93a3' } : {}}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map(image => (
          <div key={image.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image Preview */}
            <div className="relative bg-gray-100 aspect-video overflow-hidden">
              <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button
                  onClick={() => handleCopyUrl(image.url)}
                  className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  title="Copy URL"
                >
                  <FiCopy size={18} />
                </button>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  title="Download"
                >
                  <FiDownload size={18} />
                </a>
              </div>
            </div>

            {/* Image Info */}
            <div className="p-4">
              <p className="font-semibold text-gray-900 truncate">{image.name}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Type:</span> {image.type}</p>
                <p><span className="font-medium">Size:</span> {image.size}</p>
                <p><span className="font-medium">Uploaded:</span> {image.uploaded}</p>
              </div>

              {/* URL */}
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 truncate">
                {image.url}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleCopyUrl(image.url)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <FiCopy size={16} />
                  Copy URL
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No images found</p>
        </div>
      )}
    </div>
  );
};

export default ImagesManager;

