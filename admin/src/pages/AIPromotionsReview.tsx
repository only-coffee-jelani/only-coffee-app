import React, { useState, useEffect, useMemo } from 'react';
import {
  FiCheck,
  FiX,
  FiLoader,
  FiSearch,
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

interface AIPromotion {
  id: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'completed';
  goal: 'retention' | 'acquisition' | 'revenue' | 'engagement';
  title: string;
  description?: string;
  offerType: 'percentage_discount' | 'fixed_discount' | 'free_item' | 'buy_x_get_y' | 'points_bonus';
  offerValue: number;
  targetSegments: string[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  confidenceScore: number;
  mlContext: {
    topSegments: Array<{ segment: string; count: number; avgChurnRisk: number }>;
    averageChurnRisk: number;
    popularItems?: Array<{ id: string; name: string; frequency: number }>;
    weatherContext?: any;
    triggerType?: string;
  };
  generatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  estimatedImpact?: {
    reachUsers: number;
    expectedRevenue: number;
    retentionLift: number;
  };
}

interface QueueStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
  oldestPending?: string;
}

const AIPromotionsReview = () => {
  const [promotions, setPromotions] = useState<AIPromotion[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence'>('oldest');

  // Modal states
  const [reviewModal, setReviewModal] = useState<{
    show: boolean;
    promotion: AIPromotion | null;
    action: 'approve' | 'reject' | null;
  }>({ show: false, promotion: null, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReviewQueue();
    fetchQueueStats();
  }, []);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/ai-promotions/review-queue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch review queue');

      const data = await response.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error('Error fetching review queue:', error);
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/ai-promotions/stats/queue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch queue stats');

      const data = await response.json();
      setQueueStats(data.stats);
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchReviewQueue(), fetchQueueStats()]);
    setRefreshing(false);
    toast.success('Review queue refreshed');
  };

  const handleReview = (promotion: AIPromotion, action: 'approve' | 'reject') => {
    setReviewModal({ show: true, promotion, action });
    setRejectionReason('');
  };

  const submitReview = async () => {
    if (!reviewModal.promotion || !reviewModal.action) return;

    if (reviewModal.action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('adminToken');
      const endpoint = `${API_BASE}/ai-promotions/${reviewModal.promotion.id}/${reviewModal.action}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: reviewModal.action === 'reject' ? JSON.stringify({ reason: rejectionReason }) : undefined,
      });

      if (!response.ok) throw new Error(`Failed to ${reviewModal.action} promotion`);

      toast.success(
        `Promotion ${reviewModal.action === 'approve' ? 'approved' : 'rejected'} successfully`
      );
      setReviewModal({ show: false, promotion: null, action: null });
      await handleRefresh();
    } catch (error) {
      console.error(`Error ${reviewModal.action}ing promotion:`, error);
      toast.error(`Failed to ${reviewModal.action} promotion`);
    } finally {
      setProcessing(false);
    }
  };

  // Filter and sort promotions
  const filteredAndSortedPromotions = useMemo(() => {
    let filtered = promotions.filter((promo) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        promo.title.toLowerCase().includes(searchLower) ||
        (promo.description && promo.description.toLowerCase().includes(searchLower)) ||
        promo.targetSegments.some((seg) => seg.toLowerCase().includes(searchLower));

      // Goal filter
      const matchesGoal = goalFilter === 'all' || promo.goal === goalFilter;

      // Confidence filter
      let matchesConfidence = true;
      if (confidenceFilter === 'high') matchesConfidence = promo.confidenceScore >= 0.8;
      else if (confidenceFilter === 'medium')
        matchesConfidence = promo.confidenceScore >= 0.5 && promo.confidenceScore < 0.8;
      else if (confidenceFilter === 'low') matchesConfidence = promo.confidenceScore < 0.5;

      return matchesSearch && matchesGoal && matchesConfidence;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submittedAt || b.generatedAt).getTime() - new Date(a.submittedAt || a.generatedAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.submittedAt || a.generatedAt).getTime() - new Date(b.submittedAt || b.generatedAt).getTime();
      } else if (sortBy === 'confidence') {
        return b.confidenceScore - a.confidenceScore;
      }
      return 0;
    });

    return filtered;
  }, [promotions, searchTerm, goalFilter, confidenceFilter, sortBy]);

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'retention':
        return <FiTarget className="text-blue-500" />;
      case 'acquisition':
        return <FiTrendingUp className="text-green-500" />;
      case 'revenue':
        return <FiTrendingDown className="text-purple-500" />;
      case 'engagement':
        return <FiClock className="text-orange-500" />;
      default:
        return <FiTarget className="text-gray-500" />;
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheckCircle className="mr-1" size={12} />
          High ({(score * 100).toFixed(0)}%)
        </span>
      );
    } else if (score >= 0.5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FiAlertCircle className="mr-1" size={12} />
          Medium ({(score * 100).toFixed(0)}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FiXCircle className="mr-1" size={12} />
          Low ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
  };

  const formatOfferValue = (promo: AIPromotion) => {
    if (promo.offerType === 'percentage_discount') {
      return `${promo.offerValue}% OFF`;
    } else if (promo.offerType === 'fixed_discount') {
      return `$${promo.offerValue.toFixed(2)} OFF`;
    } else if (promo.offerType === 'points_bonus') {
      return `${promo.offerValue}x Points`;
    } else if (promo.offerType === 'free_item') {
      return 'FREE Item';
    } else if (promo.offerType === 'buy_x_get_y') {
      return 'Buy X Get Y';
    }
    return promo.offerValue.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-pink-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Promotions Review Queue</h1>
            <p className="text-gray-600 mt-1">Review and approve AI-generated promotions</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
            style={{ backgroundColor: refreshing ? '#d1d5db' : '#ff93a3' }}
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {queueStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{queueStats.pending}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
              <p className="text-sm text-green-700">Approved</p>
              <p className="text-2xl font-bold text-green-900">{queueStats.approved}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
              <p className="text-sm text-red-700">Rejected</p>
              <p className="text-2xl font-bold text-red-900">{queueStats.rejected}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
              <p className="text-sm text-blue-700">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-900">
                {(queueStats.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Goal Filter */}
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Goals</option>
              <option value="retention">Retention</option>
              <option value="acquisition">Acquisition</option>
              <option value="revenue">Revenue</option>
              <option value="engagement">Engagement</option>
            </select>

            {/* Confidence Filter */}
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Confidence</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (50-80%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="confidence">Highest Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions List */}
      {filteredAndSortedPromotions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FiCheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">
            {searchTerm || goalFilter !== 'all' || confidenceFilter !== 'all'
              ? 'No promotions match your filters'
              : 'No pending promotions to review'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedPromotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getGoalIcon(promo.goal)}
                    <h3 className="text-xl font-semibold text-gray-900">{promo.title}</h3>
                    {getConfidenceBadge(promo.confidenceScore)}
                  </div>
                  {promo.description && <p className="text-gray-600 mb-3">{promo.description}</p>}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Offer</p>
                      <p className="text-lg font-bold" style={{ color: '#ff93a3' }}>
                        {formatOfferValue(promo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Target Segments</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {promo.targetSegments.slice(0, 3).map((segment) => (
                          <span
                            key={segment}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {segment}
                          </span>
                        ))}
                        {promo.targetSegments.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{promo.targetSegments.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Validity</p>
                      <p className="text-sm text-gray-700">
                        {promo.validFrom
                          ? new Date(promo.validFrom).toLocaleDateString()
                          : 'Not set'}{' '}
                        -{' '}
                        {promo.validUntil
                          ? new Date(promo.validUntil).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* ML Context */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">ML Context</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Avg Churn Risk</p>
                        <p className="font-medium text-gray-900">
                          {(promo.mlContext.averageChurnRisk * 100).toFixed(1)}%
                        </p>
                      </div>
                      {promo.mlContext.topSegments.length > 0 && (
                        <div>
                          <p className="text-gray-500">Top Segment</p>
                          <p className="font-medium text-gray-900">
                            {promo.mlContext.topSegments[0].segment} ({promo.mlContext.topSegments[0].count} users)
                          </p>
                        </div>
                      )}
                      {promo.mlContext.triggerType && (
                        <div>
                          <p className="text-gray-500">Trigger Type</p>
                          <p className="font-medium text-gray-900">{promo.mlContext.triggerType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estimated Impact */}
                  {promo.estimatedImpact && (
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-gray-500">Estimated Reach</p>
                        <p className="font-semibold text-gray-900">{promo.estimatedImpact.reachUsers} users</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expected Revenue</p>
                        <p className="font-semibold text-gray-900">
                          ${promo.estimatedImpact.expectedRevenue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Retention Lift</p>
                        <p className="font-semibold text-gray-900">
                          +{(promo.estimatedImpact.retentionLift * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Submitted: {new Date(promo.submittedAt || promo.generatedAt).toLocaleString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleReview(promo, 'approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <FiCheck size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(promo, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FiX size={18} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.show && reviewModal.promotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {reviewModal.action === 'approve' ? 'Approve Promotion' : 'Reject Promotion'}
            </h3>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Promotion:</span> {reviewModal.promotion.title}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Offer:</span> {formatOfferValue(reviewModal.promotion)}
              </p>
            </div>

            {reviewModal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Please provide a reason for rejecting this promotion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setReviewModal({ show: false, promotion: null, action: null })}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                style={{
                  backgroundColor:
                    reviewModal.action === 'approve' ? '#10b981' : '#ef4444',
                }}
              >
                {processing ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewModal.action === 'approve' ? <FiCheck /> : <FiX />}
                    {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
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

export default AIPromotionsReview;
