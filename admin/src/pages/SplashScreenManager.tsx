import React, { useState, useEffect } from 'react';
import { FiUpload, FiSave, FiEye, FiX, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';

const SplashScreenManager = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    displayDuration: 3,
    targetMenuItemId: '',
    targetUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  // Current active splash screen from database (for preview)
  const [currentActiveSplash, setCurrentActiveSplash] = useState<any>(null);

  // Edit mode for current splash screen
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDate = () => {
    const today = new Date();
    // Use local date, not UTC
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadCurrentSplashScreen = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/splash-screen/current', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });

        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            if (data) {
              // Store the current active splash screen for preview only
              setCurrentActiveSplash(data);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load splash screen:', error);
        // Continue with empty form if there's an error
      } finally {
        setInitialLoading(false);
      }
    };

    loadCurrentSplashScreen();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
    }));
    toast.success('Image uploaded successfully!');
  };



  const handleClearForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      displayDuration: 3,
      targetMenuItemId: '',
      targetUrl: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setIsEditingCurrent(false);
    setEditFormData(null);
    toast.success('Form cleared');
  };

  const handleLoadCurrentForEdit = () => {
    if (currentActiveSplash) {
      setFormData({
        title: currentActiveSplash.title || '',
        description: currentActiveSplash.description || '',
        imageUrl: currentActiveSplash.imageUrl || '',
        displayDuration: currentActiveSplash.displayDuration || 3,
        targetMenuItemId: '',
        targetUrl: '',
        startDate: '',
        endDate: currentActiveSplash.endDate ? currentActiveSplash.endDate.split('T')[0] : '',
        isActive: true,
      });
      setEditFormData({
        id: currentActiveSplash.id,
      });
      setIsEditingCurrent(true);
      toast.success('Loaded current splash for editing');
    }
  };

  const handleSave = async () => {
    // If editing current splash, only allow description, duration, and end date
    if (isEditingCurrent && editFormData) {
      setLoading(true);
      try {
        const dataToSave = {
          description: formData.description,
          displayDuration: formData.displayDuration,
          endDate: formData.endDate || null,
          imageUrl: formData.imageUrl,
        };

        const response = await fetch(`http://localhost:3000/api/v1/splash-screen/${editFormData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) throw new Error('Failed to save');

        const updatedData = await response.json();
        setCurrentActiveSplash(updatedData);
        setIsEditingCurrent(false);
        setEditFormData(null);
        handleClearForm();
        toast.success('Splash screen updated successfully!');
      } catch (error) {
        toast.error('Failed to update splash screen');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Creating new splash screen
    // Validate start date is not in the past
    if (formData.startDate) {
      const startDate = new Date(formData.startDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        toast.error('Start date cannot be in the past');
        return;
      }
    }

    // Validate end date is after start date if both are set
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }
    }

    setLoading(true);
    try {
      // Convert empty date strings to null
      const dataToSave = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      const response = await fetch('http://localhost:3000/api/v1/splash-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Splash screen created successfully!');
      handleClearForm();
    } catch (error) {
      toast.error('Failed to save splash screen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Splash Screen Manager</h1>
          <p className="text-gray-600 mt-2 text-lg">Create and manage your app's launch modal experience</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Form Header */}
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-pink-50 via-white to-pink-50">
              <h3 className="text-2xl font-bold text-gray-900">
                {isEditingCurrent ? 'Edit Current Splash Screen' : 'Create New Splash Screen'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {isEditingCurrent
                  ? 'Update the description, duration, and end date of the current active splash screen'
                  : 'Design and configure your promotional splash screen'
                }
              </p>
            </div>

            {/* Form Content */}
            <form className="p-8 space-y-7">
              {/* Title - Editable in create mode, disabled in edit mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Splash Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Fall Special: Waffolino"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isEditingCurrent}
                  className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                    isEditingCurrent
                      ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                      : 'border-gray-200 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                  }`}
                />
              </div>

              {/* Image Upload - Editable in both modes */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Splash Image</label>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-pink-300 transition-colors">
                  <ImageUploader
                    onUpload={handleImageUpload}
                    folder="promotions"
                    imageUrl={formData.imageUrl}
                    onClear={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  />
                </div>
              </div>

              {/* Description - Available in both modes */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Description</label>
                <textarea
                  name="description"
                  placeholder="Describe your splash screen promotion..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none"
                />
              </div>

              {/* Display Duration - Available in both modes */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Display Duration (seconds)</label>
                <input
                  type="number"
                  name="displayDuration"
                  value={formData.displayDuration}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>

              {/* Date Range - Available in both modes */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Date Range <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                <p className="text-xs text-gray-600 mb-4">Leave empty to show indefinitely</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      disabled={isEditingCurrent}
                      min={getTodayDate()}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                        isEditingCurrent
                          ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || getTodayDate()}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status - Available in both modes, disabled in edit mode */}
              <div className={`rounded-xl p-5 border flex items-center justify-between transition-colors ${
                isEditingCurrent
                  ? 'bg-gray-100 border-gray-200'
                  : 'bg-gradient-to-r from-pink-50 to-pink-50 border-pink-200'
              }`}>
                <div>
                  <label className={`text-sm font-semibold ${isEditingCurrent ? 'text-gray-500' : 'text-gray-800'}`}>
                    Activate Immediately
                  </label>
                  <p className={`text-xs mt-1 ${isEditingCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isEditingCurrent ? 'Cannot change status while editing' : 'This will replace the current active splash screen'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isEditingCurrent && setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  disabled={isEditingCurrent}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 flex-shrink-0 ${
                    isEditingCurrent
                      ? 'opacity-50 cursor-not-allowed'
                      : formData.isActive ? 'bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/30' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                      formData.isActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="py-3 rounded-xl font-semibold text-gray-700 transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 active:scale-95"
                >
                  <FiX size={20} />
                  {isEditingCurrent ? 'Cancel' : 'Clear Form'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <FiSave size={20} />
                  {loading ? 'Saving...' : isEditingCurrent ? 'Save Changes' : 'Create Splash Screen'}
                </button>
              </div>
            </form>
          </div>
          </div>

          {/* Preview - Current Active Splash Screen */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 sticky top-8 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-pink-50 via-white to-pink-50">
              <h3 className="text-2xl font-bold text-gray-900">Current Active Splash</h3>
              <p className="text-sm text-gray-600 mt-2">Live preview of your active promotion</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {currentActiveSplash ? (
                <>
                    {/* Image Preview */}
                    {currentActiveSplash.imageUrl && (
                      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden aspect-video mb-6 group cursor-pointer shadow-lg" onClick={() => setShowFullImage(true)}>
                        <img
                          src={currentActiveSplash.imageUrl}
                          alt="Splash Screen Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="text-center text-white">
                            <p className="text-lg font-bold">Skip in {currentActiveSplash.displayDuration}s</p>
                          </div>
                        </div>
                        {/* Hover overlay with expand icon */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300">
                          <FiMaximize2 size={40} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Title</p>
                      <p className="text-2xl font-bold text-gray-900">{currentActiveSplash.title || '—'}</p>
                    </div>

                    {/* Description */}
                    {currentActiveSplash.description && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{currentActiveSplash.description}</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Status:</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md ${
                        currentActiveSplash.isActive
                          ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                          : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
                      }`}>
                        <span className={`w-3 h-3 rounded-full animate-pulse ${currentActiveSplash.isActive ? 'bg-green-600' : 'bg-gray-600'}`}></span>
                        {currentActiveSplash.isActive ? 'Live' : 'Inactive'}
                      </span>
                    </div>

                    {/* Duration and Date Range */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-gradient-to-br from-pink-50 to-pink-50 rounded-xl p-4 border border-pink-200">
                        <p className="text-xs font-bold text-pink-600 uppercase tracking-widest mb-2">Duration</p>
                        <p className="text-3xl font-bold text-pink-900">{currentActiveSplash.displayDuration}<span className="text-lg">s</span></p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Date Range</p>
                        <p className="text-sm text-blue-900 font-semibold">
                          {currentActiveSplash.startDate && currentActiveSplash.endDate
                            ? `${currentActiveSplash.startDate.split('T')[0]} to ${currentActiveSplash.endDate.split('T')[0]}`
                            : currentActiveSplash.startDate
                            ? `From ${currentActiveSplash.startDate.split('T')[0]}`
                            : currentActiveSplash.endDate
                            ? `Until ${currentActiveSplash.endDate.split('T')[0]}`
                            : 'No limit'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={handleLoadCurrentForEdit}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl active:scale-95"
                    >
                      Edit Splash Screen
                    </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                    <FiEye size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-semibold">No active splash screen</p>
                  <p className="text-gray-400 text-sm mt-2">Create one using the form on the left</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && currentActiveSplash?.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
          {/* Close button */}
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <FiX size={32} />
          </button>

          {/* Image container - fits entire image on screen */}
          <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center max-h-[85vh] max-w-[95vw]">
            <img
              src={currentActiveSplash.imageUrl}
              alt="Full Size Splash Screen"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Image info */}
          <div className="bg-gray-900 text-white p-4 rounded-b-lg max-w-[95vw] mt-2">
            <p className="font-semibold">{currentActiveSplash.title}</p>
            <p className="text-sm text-gray-300 mt-1">{currentActiveSplash.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreenManager;

