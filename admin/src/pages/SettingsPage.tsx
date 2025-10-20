import React, { useState } from 'react';
import { FiSave, FiLock, FiBell, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    companyName: 'Only Coffee',
    companyEmail: 'admin@onlycoffee.us',
    companyPhone: '(504) 417-1010',
    website: 'https://www.only-coffee.us',
    timezone: 'America/Chicago',
    currency: 'USD',
    notificationsEmail: true,
    notificationsSMS: false,
    notificationsPush: true,
    maintenanceMode: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password changed successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-gray-200 p-8 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your admin account and application settings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleSettingChange('companyName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleSettingChange('website', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option>America/Chicago</option>
                    <option>America/New_York</option>
                    <option>America/Los_Angeles</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="w-full py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ff93a3' }}
              >
                <FiSave size={18} />
                Save Settings
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiBell size={20} />
              Notifications
            </h2>
            <div className="space-y-4">
              {[
                { key: 'notificationsEmail', label: 'Email Notifications' },
                { key: 'notificationsSMS', label: 'SMS Notifications' },
                { key: 'notificationsPush', label: 'Push Notifications' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings] as boolean}
                    onChange={(e) => handleSettingChange(key, e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#ff93a3' }}
                  />
                  <span className="font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiShield size={20} />
              Security
            </h2>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#ff93a3' }}
              />
              <div>
                <p className="font-medium text-gray-700">Maintenance Mode</p>
                <p className="text-sm text-gray-600">Disable app access for maintenance</p>
              </div>
            </label>
          </div>
        </div>

        {/* Password Change */}
        <div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiLock size={20} />
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ff93a3' }}
              >
                <FiLock size={18} />
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SettingsPage;

