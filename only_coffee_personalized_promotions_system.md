# Only Coffee Personalized Promotions System

## Overview
Only Coffee operates native iOS and Android apps connected to a shared AWS backend (Elastic Beanstalk, PostgreSQL). This document defines the unified design, data flow, AI logic, and admin management tools for the AI-driven Personalized Promotions System. It combines the business vision and the technical framework from previous documents into a single specification.

---

## 1. System Architecture

**Core Concept:** An event-driven, hybrid cloud + edge personalization engine that observes user behaviors, learns patterns, and generates personalized promotions and engagement strategies.

### Components
- **Mobile Clients:** iOS (Swift/SwiftUI) and Android (Kotlin/Jetpack Compose)
- **Backend:** Node.js/Python services hosted on AWS Elastic Beanstalk
- **Database:** PostgreSQL (core transactional DB)
- **Data Lake/Warehouse:** AWS S3 + Redshift (for long-term analytics)
- **Streaming Layer:** Amazon Kinesis for real-time event ingestion
- **ML Services:** AWS SageMaker for model training/inference, optionally Amazon Personalize for recommendations
- **Notification Layer:** Firebase Cloud Messaging (Android), APNS (iOS), and OneSignal for unified orchestration
- **Feature Store:** Feast (online: Redis; offline: S3/Redshift)

### Event Flow
1. Mobile apps emit user events: purchases, app opens, geofence entries, streak breaks, etc.
2. Kinesis ingests events and streams to Lambda processors.
3. Lambda updates user features in PostgreSQL and Feature Store.
4. Real-time and batch ML models generate scores (e.g., churn probability, engagement timing, offer preference).
5. Decision engine evaluates rules + ML outputs and creates AI promotion suggestions.
6. Approved promotions are executed via push notifications, in-app modals, or email.
7. All actions logged for analytics and audit.

### Architecture Highlights
- Hybrid on-device and cloud learning (edge logic for geofence triggers, server for heavy ML).
- Rule-based + AI-driven hybrid decision engine.
- Reinforcement learning for continuous improvement.
- Real-time response (<2s trigger-to-notification latency).
- Secure, compliant data flow respecting ATT/GDPR/CCPA.

---

## 2. Data Model

### Tables
- **users:** core user info, loyalty status, streak count.
- **events:** behavioral logs (user_id, type, timestamp, metadata).
- **user_profile:** derived metrics (purchase frequency, recency, preferred store, churn score).
- **ai_promotions:** stores AI-suggested promotions (offer type, copy, timing, audience, status).
- **promotion_events:** execution logs (promotion_id, user_id, delivery channel, outcome).
- **user_promotions_audit:** detailed record of all user-level promo activity.
- **ai_model_logs:** model version, decision rationale, confidence, and performance.

### Feature Store (Feast)
- Offline features computed in nightly jobs.
- Online store serves real-time lookups for active users.
- Features include: avg_days_between_purchases, most_frequent_item, churn_risk_score, location_cluster, streak_length, etc.

---

## 3. Machine Learning & Decision Engine

### Model Types
- **Recommender:** Collaborative filtering for product recommendations.
- **Churn Predictor:** Time-series or survival model for lapse risk.
- **Contextual Bandit:** Optimizes offer type and timing based on past response.
- **Reinforcement Learning Agent:** Adjusts notification frequency and tone for each user.

### Workflow
1. Real-time events update features.
2. ML models generate predictions.
3. Rule engine filters triggers (missed day, near-store, routine time, milestone).
4. Decision layer merges rule triggers + ML insights → creates promotion candidates.
5. AI promotion candidates queued for admin review and optional auto-approval.

### Sample Decision Factors
- Habit consistency: missed purchase window → reminder.
- Location proximity: user entered geofence near store.
- Reward trigger: loyalty threshold reached.
- Weather/time context: hot day → iced drink offer.

### Model Retraining Schedule
- Recommender: weekly.
- Churn predictor: biweekly.
- Bandit/RL policies: continuous online learning.

---

## 4. Admin Dashboard (AI Module)

This is a **new AI & Promotions tab** integrated into the existing Only Coffee admin website (same authentication and backend).

### Features

#### A. Real-Time Analytics Dashboard
- KPIs: CTR, conversion rate, redemption rate, streak recoveries, churn prevention, revenue uplift.
- Filters: date range, promotion type (manual/AI), channel, store, or user segment.
- Visualization: interactive charts and tables.

#### B. Promotions Management Tab
- Create, edit, and schedule manual promotions.
- View AI-generated promotions with:
  - Offer details, suggested text, timing, and target audience.
  - Confidence and predicted ROI.
- Actions: **Approve, Edit, Reject, or Override**.
- Manual override creates a human-authored version.
- Approved promotions automatically queued for delivery.
- Email notifications sent to admin when new AI promotions are generated.
- Each promotion entry shows performance metrics and status (pending, active, completed).

#### C. Model Insights Panel
- Visual explanations of AI decisions:
  - Confidence levels and top factors.
  - Model performance over time.
  - Comparison of AI vs manual campaign success.
- Insight cards showing trends (e.g., "Morning offers outperform evening offers by 28%").
- Option to download reports or trigger retraining.

#### D. User-Level Audit Trail
- Search by user, campaign, or date.
- Shows every promotion delivered, user response, and conversion.
- Displays model version and decision reason per instance.
- Exportable CSV or PDF.

#### E. AI Governance & Logging
- All AI actions timestamped and logged.
- Audit log includes who approved/rejected promotions and model rationale.
- Allows admin override of AI behaviors (pause, retrain, disable model).

---

## 5. APIs & Automation

### Endpoints
```
GET /api/ai/promotions/suggested
POST /api/ai/promotions/approve/:id
POST /api/ai/promotions/reject/:id
POST /api/ai/promotions/override
GET /api/ai/insights
GET /api/ai/audit
```

### Automation
- **Email Notifications:** AWS SES/SendGrid sends alerts for new AI-generated promotions.
- **Batch Jobs:** Airflow handles daily/weekly feature computation and retraining.
- **WebSocket/GraphQL Subscriptions:** real-time updates to admin dashboard analytics.

---

## 6. Privacy & Compliance
- ATT prompt for cross-app tracking (if used), optional.
- GDPR/CCPA-compliant consent and deletion workflows.
- Encryption at rest (RDS, S3) and in transit (HTTPS/TLS 1.2+).
- Pseudonymization for training data.
- User-facing controls for notification and data permissions.

---

## 7. UX & Engagement Design
- Personalized tone and copywriting library.
- Dynamic visuals in notifications (product image, name).
- Frequency capping and adaptive fatigue scoring.
- User controls for notification preferences.
- Seasonal and milestone campaigns with emotional design.

---

## 8. Future Extensions
- Predictive menu recommendations and dynamic bundles.
- Loyalty gamification (quests, streak bonuses).
- Partner promotions (opt-in integrations with fitness/transport apps).
- Conversational or voice-based AI interactions.
- Dynamic pricing and uplift modeling.
- Advanced model monitoring (bias detection, drift alerts).

---

## 9. Implementation Roadmap

| Phase | Duration | Milestones |
|-------|-----------|-------------|
| **1. Foundation** | Weeks 1-2 | Event ingestion, schema creation, Kinesis → PostgreSQL pipeline |
| **2. MVP** | Weeks 3-6 | Rule-based triggers (missed day, geofence, streak); basic admin dashboard analytics |
| **3. Learning Engine** | Weeks 7-10 | Integrate contextual bandit and recommender; feature store setup; AI suggestion feed to admin panel |
| **4. Governance & Optimization** | Weeks 11-14 | Admin approvals, override, audit trail, email alerts, model insight visualizations |
| **5. Scaling** | Weeks 15-20 | Full RL policy learning, A/B testing, predictive scheduling, performance monitoring |

---

## 10. Summary
This unified blueprint provides a holistic architecture and operational design for the Only Coffee Personalized Promotions System. It connects app analytics, AI-driven decision-making, and administrative oversight in one ecosystem. The result: a transparent, self-learning marketing engine that feels human to customers while giving administrators full control and insight into how personalization drives growth.

