import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  folder: string;
  imageUrl?: string;
  onClear?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, folder, imageUrl, onClear }) => {
  const [preview, setPreview] = useState<string | null>(imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Sync preview with imageUrl from parent
  useEffect(() => {
    setPreview(imageUrl || null);
  }, [imageUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewData = e.target?.result as string;
      setPreview(previewData);
      console.log('Preview set:', previewData ? 'Image loaded' : 'No image');
    };
    reader.readAsDataURL(file);

    // Upload to S3
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('http://localhost:3000/api/v1/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onUpload(data.url);
      toast.success('Image uploaded successfully!');
      // Keep the preview visible after upload
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onUpload, folder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    disabled: uploading,
  });

  const handleClear = () => {
    setPreview(null);
    onClear?.();
  };

  return (
    <div>
      {preview ? (
        <div className="space-y-2">
          <div className="relative group cursor-pointer bg-white rounded-lg p-4 flex items-center justify-center border border-gray-200" onClick={() => {
            console.log('Image container clicked, opening full screen');
            setShowFullImage(true);
          }}>
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-96 object-contain"
            />
            {/* Hover overlay with expand icon */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all duration-200 rounded-lg">
              <FiMaximize2 size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="w-full p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
          >
            <FiX size={18} />
            Clear Image
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-pink-500 bg-pink-50'
              : 'border-gray-300 hover:border-pink-300 bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <FiUpload size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-gray-700 font-medium">
            {uploading ? 'Uploading...' : 'Drag and drop your image here'}
          </p>
          <p className="text-gray-500 text-sm mt-1">or click to select a file</p>
          <p className="text-gray-400 text-xs mt-2">PNG, JPG, WebP up to 5MB</p>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {showFullImage && preview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowFullImage(false)}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullImage(false);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            style={{ zIndex: 10000 }}
            aria-label="Close"
          >
            <FiX size={32} />
          </button>

          {/* Image container - fits entire image on screen */}
          <div
            className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center max-h-[85vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={preview}
              alt="Full Size Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

