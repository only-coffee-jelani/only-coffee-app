/**
 * User Feature Interfaces
 * Defines the structure of features used for ML models and personalization
 */

export interface RFMFeatures {
  // Recency: Days since last purchase
  daysSinceLastPurchase: number;
  daysSinceLastAppOpen: number;

  // Frequency: Count of interactions
  totalPurchases: number;
  purchasesLast7Days: number;
  purchasesLast30Days: number;
  purchasesLast90Days: number;
  appOpensLast7Days: number;
  appOpensLast30Days: number;

  // Monetary: Purchase amounts
  totalSpent: number;
  averageOrderValue: number;
  lifetimeValue: number;
  spentLast7Days: number;
  spentLast30Days: number;
  spentLast90Days: number;

  // RFM Scores (1-5 scale)
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmScore: number; // Combined RFM score
}

export interface EngagementFeatures {
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: Date | null;

  // Engagement metrics
  averageSessionDuration: number; // seconds
  averageTimeBetweenVisits: number; // hours
  menuViewsLast7Days: number;
  menuViewsLast30Days: number;

  // Product interactions
  favoriteCategories: string[]; // Top 3 categories
  mostViewedItems: string[]; // Top 5 item IDs
  mostPurchasedItems: string[]; // Top 5 item IDs

  // Time patterns
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  preferredDayOfWeek: string | null; // 'monday', 'tuesday', etc.

  // Loyalty
  isLoyaltyMember: boolean;
  loyaltyPoints: number;
  loyaltyTier: string | null;
}

export interface BehavioralFeatures {
  // Cart behavior
  cartAbandonmentRate: number;
  averageCartSize: number;
  averageItemsPerOrder: number;

  // Discount sensitivity
  ordersWithPromoCode: number;
  ordersWithoutPromoCode: number;
  discountSensitivityScore: number; // 0-1

  // Location patterns
  favoriteStoreId: string | null;
  uniqueStoresVisited: number;
  averageDistanceToStore: number | null; // km

  // Device and platform
  primaryDevice: 'iOS' | 'Android' | null;
  appVersion: string | null;
  hasEnabledNotifications: boolean;
}

export interface ContextualFeatures {
  // Current context (real-time)
  currentWeatherTemp: number | null;
  currentWeatherCondition: string | null;
  isHotWeather: boolean;
  isColdWeather: boolean;
  isRainyWeather: boolean;

  // Location context
  currentLatitude: number | null;
  currentLongitude: number | null;
  distanceToNearestStore: number | null; // km
  isNearStore: boolean; // Within 1km

  // Temporal context
  currentHourOfDay: number;
  currentDayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;

  // Session context
  sessionId: string | null;
  sessionStartTime: Date | null;
  eventsInCurrentSession: number;
}

export interface ChurnPredictionFeatures {
  // Churn risk indicators
  daysSinceLastActivity: number;
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  engagementDeclineRate: number; // Percentage decrease

  // Predicted churn probability (0-1, from ML model)
  churnProbability: number | null;
  churnRiskSegment: 'low' | 'medium' | 'high' | 'critical' | null;

  // Intervention history
  lastPromotionReceived: Date | null;
  daysSinceLastPromotion: number | null;
  promotionResponseRate: number; // 0-1
}

export interface UserFeatureVector {
  userId: string;
  computedAt: Date;

  // Feature groups
  rfm: RFMFeatures;
  engagement: EngagementFeatures;
  behavioral: BehavioralFeatures;
  contextual: ContextualFeatures;
  churn: ChurnPredictionFeatures;

  // Metadata
  featureVersion: string; // e.g., "1.0.0"
  dataQuality: {
    completeness: number; // 0-1
    freshness: number; // 0-1 (based on data recency)
    confidence: number; // 0-1
  };
}

export interface FeatureComputationOptions {
  userId: string;

  // Context for real-time features
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  sessionId?: string;

  // Feature groups to compute (optional - computes all if not specified)
  includeRFM?: boolean;
  includeEngagement?: boolean;
  includeBehavioral?: boolean;
  includeContextual?: boolean;
  includeChurn?: boolean;

  // Cache control
  forceRefresh?: boolean; // Bypass cache and recompute
  cacheTTL?: number; // Custom cache TTL in seconds
}
