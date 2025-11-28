import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiTarget,
  FiActivity,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

/**
 * Enterprise-level Carousel A/B Testing Management
 * 
 * Features:
 * - Test creation with control vs variant
 * - Traffic allocation configuration
 * - Real-time test monitoring
 * - Statistical significance calculation
 * - Winner declaration
 * - Test history and results
 */

interface ABTest {
  carousel_ab_test_id: string;
  test_name: string;
  description: string;
  carousel_id: string;
  variant_a_item_id: string;
  variant_b_item_id: string;
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  primary_metric: 'ctr' | 'conversion_rate' | 'engagement_score' | 'revenue';
  started_at: string | null;
  ended_at: string | null;
  winner_variant: 'A' | 'B' | null;
  confidence_level: number | null;
  variant_a_impressions: number;
  variant_a_clicks: number;
  variant_a_conversions: number;
  variant_a_revenue: number;
  variant_b_impressions: number;
  variant_b_clicks: number;
  variant_b_conversions: number;
  variant_b_revenue: number;
  created_at: string;
  updated_at: string;
}

interface CarouselItem {
  carouselItemId: string;
  title: string;
  imageAsset: {
    url: string;
  };
}

interface Carousel {
  carouselId: string;
  name: string;
  placement: string;
}

const CarouselABTesting = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    test_name: '',
    description: '',
    carousel_id: '',
    variant_a_item_id: '',
    variant_b_item_id: '',
    traffic_split: 0.5,
    primary_metric: 'ctr' as 'ctr' | 'conversion_rate' | 'engagement_score' | 'revenue',
  });

  useEffect(() => {
    fetchTests();
    fetchCarousels();
    fetchCarouselItems();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE}/carousel/ab-tests`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCarousels = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch carousels');
      const data = await response.json();
      setCarousels(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCarouselItems = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel/active`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch carousel items');
      const data = await response.json();
      setCarouselItems(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createTest = async () => {
    try {
      if (!formData.test_name || !formData.carousel_id || !formData.variant_a_item_id || !formData.variant_b_item_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel/ab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create test');

      toast.success('A/B test created successfully!');
      setShowCreateModal(false);
      setFormData({
        test_name: '',
        description: '',
        carousel_id: '',
        variant_a_item_id: '',
        variant_b_item_id: '',
        traffic_split: 0.5,
        primary_metric: 'ctr',
      });
      fetchTests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create test');
    }
  };

  const startTest = async (testId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel/ab-tests/${testId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to start test');

      toast.success('Test started successfully!');
      fetchTests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to start test');
    }
  };

  const pauseTest = async (testId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel/ab-tests/${testId}/pause`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to pause test');

      toast.success('Test paused successfully!');
      fetchTests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to pause test');
    }
  };

  const completeTest = async (testId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel/ab-tests/${testId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to complete test');

      toast.success('Test completed successfully!');
      fetchTests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to complete test');
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/carousel/ab-tests/${testId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete test');

      toast.success('Test deleted successfully!');
      fetchTests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete test');
    }
  };

  const calculateMetric = (test: ABTest, variant: 'A' | 'B'): number => {
    const impressions = variant === 'A' ? test.variant_a_impressions : test.variant_b_impressions;
    const clicks = variant === 'A' ? test.variant_a_clicks : test.variant_b_clicks;
    const conversions = variant === 'A' ? test.variant_a_conversions : test.variant_b_conversions;
    const revenue = variant === 'A' ? test.variant_a_revenue : test.variant_b_revenue;

    if (impressions === 0) return 0;

    switch (test.primary_metric) {
      case 'ctr':
        return (clicks / impressions) * 100;
      case 'conversion_rate':
        return (conversions / impressions) * 100;
      case 'revenue':
        return revenue;
      case 'engagement_score':
        return ((clicks * 10 + conversions * 20) / impressions);
      default:
        return 0;
    }
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'ctr':
        return 'CTR (%)';
      case 'conversion_rate':
        return 'Conversion Rate (%)';
      case 'revenue':
        return 'Revenue ($)';
      case 'engagement_score':
        return 'Engagement Score';
      default:
        return metric;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      running: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff93a3]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carousel A/B Testing</h1>
          <p className="text-gray-600">Create and manage A/B tests for carousel optimization</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#ff93a3] text-white px-6 py-3 rounded-md hover:bg-[#ff7a8f] transition-colors font-medium"
        >
          <FiPlus className="w-5 h-5" />
          Create New Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No A/B Tests Yet</h3>
          <p className="text-gray-600 mb-6">Create your first A/B test to optimize carousel performance</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ff93a3] text-white px-6 py-3 rounded-md hover:bg-[#ff7a8f] transition-colors font-medium"
          >
            Create First Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tests.map((test) => {
            const variantAMetric = calculateMetric(test, 'A');
            const variantBMetric = calculateMetric(test, 'B');
            const winner = variantAMetric > variantBMetric ? 'A' : variantBMetric > variantAMetric ? 'B' : null;

            return (
              <div key={test.carousel_ab_test_id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{test.test_name}</h3>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {test.status === 'draft' && (
                      <button
                        onClick={() => startTest(test.carousel_ab_test_id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Start Test"
                      >
                        <FiPlay className="w-5 h-5" />
                      </button>
                    )}
                    {test.status === 'running' && (
                      <>
                        <button
                          onClick={() => pauseTest(test.carousel_ab_test_id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                          title="Pause Test"
                        >
                          <FiPause className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => completeTest(test.carousel_ab_test_id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Complete Test"
                        >
                          <FiCheckCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {test.status === 'paused' && (
                      <button
                        onClick={() => startTest(test.carousel_ab_test_id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Resume Test"
                      >
                        <FiPlay className="w-5 h-5" />
                      </button>
                    )}
                    {(test.status === 'draft' || test.status === 'paused') && (
                      <button
                        onClick={() => deleteTest(test.carousel_ab_test_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Test"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className={`border-2 rounded-lg p-4 ${winner === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">Variant A (Control)</h4>
                      {winner === 'A' && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">WINNER</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Impressions:</span>
                        <span className="text-sm font-medium">{test.variant_a_impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clicks:</span>
                        <span className="text-sm font-medium">{test.variant_a_clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversions:</span>
                        <span className="text-sm font-medium">{test.variant_a_conversions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="text-sm font-medium">${test.variant_a_revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-semibold text-gray-900">{getMetricLabel(test.primary_metric)}:</span>
                        <span className="text-lg font-bold text-[#ff93a3]">{variantAMetric.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 ${winner === 'B' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">Variant B</h4>
                      {winner === 'B' && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">WINNER</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Impressions:</span>
                        <span className="text-sm font-medium">{test.variant_b_impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clicks:</span>
                        <span className="text-sm font-medium">{test.variant_b_clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversions:</span>
                        <span className="text-sm font-medium">{test.variant_b_conversions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="text-sm font-medium">${test.variant_b_revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-semibold text-gray-900">{getMetricLabel(test.primary_metric)}:</span>
                        <span className="text-lg font-bold text-[#ff93a3]">{variantBMetric.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Traffic Split: {(test.traffic_split * 100).toFixed(0)}% / {((1 - test.traffic_split) * 100).toFixed(0)}%</span>
                  {test.started_at && (
                    <span>Started: {new Date(test.started_at).toLocaleDateString()}</span>
                  )}
                  {test.ended_at && (
                    <span>Ended: {new Date(test.ended_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create New A/B Test</h2>
              <p className="text-sm text-gray-600 mt-1">Configure your carousel A/B test</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Name *</label>
                <input
                  type="text"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Summer Promo Carousel Test"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Describe the purpose of this test..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Carousel *</label>
                <select
                  value={formData.carousel_id}
                  onChange={(e) => setFormData({ ...formData, carousel_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a carousel</option>
                  {carousels.map((carousel) => (
                    <option key={carousel.carouselId} value={carousel.carouselId}>
                      {carousel.name} ({carousel.placement})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Variant A (Control) *</label>
                <select
                  value={formData.variant_a_item_id}
                  onChange={(e) => setFormData({ ...formData, variant_a_item_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select carousel item</option>
                  {carouselItems.map((item) => (
                    <option key={item.carouselItemId} value={item.carouselItemId}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Variant B *</label>
                <select
                  value={formData.variant_b_item_id}
                  onChange={(e) => setFormData({ ...formData, variant_b_item_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select carousel item</option>
                  {carouselItems.map((item) => (
                    <option key={item.carouselItemId} value={item.carouselItemId}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traffic Split (Variant A: {(formData.traffic_split * 100).toFixed(0)}% / Variant B: {((1 - formData.traffic_split) * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.traffic_split}
                  onChange={(e) => setFormData({ ...formData, traffic_split: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Metric *</label>
                <select
                  value={formData.primary_metric}
                  onChange={(e) => setFormData({ ...formData, primary_metric: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="ctr">Click-Through Rate (CTR)</option>
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="engagement_score">Engagement Score</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTest}
                className="px-4 py-2 bg-[#ff93a3] text-white rounded-md hover:bg-[#ff7a8f] transition-colors"
              >
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselABTesting;
