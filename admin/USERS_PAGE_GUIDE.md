# Users & Analytics Page - Complete Guide

## 📊 Overview

The new **Users & Analytics** page provides comprehensive customer insights to help drive sales, improve retention, and optimize marketing strategies.

**Location:** `/users` or click "Users & Analytics" in the sidebar

---

## 🎯 Key Features

### 1. **Dashboard Statistics**
Five key metrics at the top:
- **Total Users** - Complete customer base size
- **Active Users** - Users who have logged in recently
- **Loyalty Members** - Enrolled in loyalty program
- **Avg Lifetime Value** - Average revenue per customer
- **Churn Risk** - Number of at-risk customers

### 2. **Advanced Filtering & Search**
- **Search Box** - Find users by email, first name, or last name
- **Loyalty Tier Filter** - Filter by: All, Bronze, Silver, Gold, Platinum, Black
- **Status Filter** - View: All Status, Active, Inactive, or Churn Risk users
- **Sort Options** - Sort by: Last Order, Total Spent, Loyalty Points, Order Count

### 3. **User Data Table**
Displays all user information in an organized table:

| Column | Information |
|--------|-------------|
| **User** | Name and email address |
| **Tier** | Loyalty tier badge |
| **Points** | Current loyalty points balance |
| **Total Spent** | Lifetime revenue from user |
| **Orders** | Total number of orders |
| **Last Order** | Date of most recent order |
| **Status** | Active/Inactive indicator |
| **Action** | Expand for detailed view |

### 4. **Expandable User Details**
Click "Details" to see additional information:
- Phone number
- Member since date
- Last login date
- Average order value
- Email verification status
- Marketing opt-in status
- Loyalty member status
- Churn risk level

### 5. **Export Functionality**
- **Export CSV Button** - Download filtered user data
- Includes all visible columns
- Useful for external analysis, email campaigns, or reporting

---

## 💡 Use Cases

### Sales & Revenue Optimization
1. **Sort by Total Spent** - Identify top customers
2. **Filter by Platinum/Black Tier** - Target VIP customers
3. **Export data** - Create targeted promotions

### Customer Retention
1. **Filter by Churn Risk** - Find at-risk customers
2. **Check Last Order date** - Identify inactive users
3. **Review Loyalty Points** - Offer point bonuses to re-engage

### Loyalty Program Management
1. **Filter by Loyalty Tier** - Analyze tier distribution
2. **Sort by Loyalty Points** - Find power users
3. **Check Marketing Opt-In** - Build email lists

### Marketing Campaigns
1. **Filter by Status** - Target active users only
2. **Search by email** - Find specific customers
3. **Export for email campaigns** - Use CSV for bulk outreach

### Analytics & Reporting
1. **Track Active Users** - Monitor engagement
2. **Monitor Avg Lifetime Value** - Measure business health
3. **Analyze Churn Risk** - Predict customer loss

---

## 📈 Data Insights

### What Each Metric Tells You

**Total Users**
- Growing number = business expansion
- Stagnant = need marketing push

**Active Users**
- High percentage = good engagement
- Low percentage = retention issue

**Loyalty Members**
- Higher = better customer commitment
- Lower = need to promote loyalty program

**Avg Lifetime Value**
- Higher = more profitable customers
- Lower = need to increase order frequency/value

**Churn Risk**
- High count = retention crisis
- Low count = healthy customer base

---

## 🔍 Filtering Examples

### Find High-Value Customers
1. Sort by "Total Spent"
2. Filter Status: "Active"
3. Filter Tier: "Platinum" or "Black"

### Identify Inactive Customers
1. Filter Status: "Inactive"
2. Sort by "Last Order"
3. Export for re-engagement campaign

### Analyze Loyalty Program
1. Filter Tier: "Bronze"
2. Sort by "Loyalty Points"
3. Check who's close to next tier

### Find Churn Risk
1. Filter Status: "Churn Risk"
2. Sort by "Last Order"
3. Export for win-back campaign

---

## 📊 CSV Export Format

When you export, you get a CSV file with:
- Email
- Full Name
- Phone
- Loyalty Tier
- Loyalty Points
- Total Spent
- Order Count
- Last Order Date
- Active Status
- Loyalty Member Status

Perfect for:
- Email marketing platforms
- CRM systems
- Excel analysis
- Business intelligence tools

---

## 🎨 Design Features

- **Brand Color** - Pink (#ff93a3) for consistency
- **Responsive Design** - Works on desktop and tablet
- **Real-time Search** - Instant filtering
- **Expandable Rows** - See details without leaving table
- **Status Badges** - Quick visual indicators
- **Tier Badges** - Color-coded loyalty levels

---

## 🔗 Integration Points

The Users page connects to:
- **Backend API** - `/api/v1/users` endpoint
- **User Database** - PostgreSQL users table
- **Analytics System** - Churn prediction models
- **Loyalty System** - Tier and points data

---

## 📝 Tips & Best Practices

1. **Regular Monitoring** - Check churn risk weekly
2. **Segment Analysis** - Filter by tier to understand segments
3. **Export Regularly** - Create historical records
4. **Track Trends** - Monitor active user growth
5. **Target Campaigns** - Use filters for precision marketing

---

## 🚀 Future Enhancements

Potential additions:
- User behavior timeline
- Purchase history details
- Personalized offer recommendations
- Bulk actions (send promotions, adjust points)
- Advanced analytics charts
- Cohort analysis
- Predictive recommendations

---

## ❓ FAQ

**Q: How often is data updated?**
A: Real-time from the database

**Q: Can I edit user data?**
A: Currently view-only; editing coming soon

**Q: How do I identify VIP customers?**
A: Filter by Platinum/Black tier and sort by Total Spent

**Q: What does Churn Risk mean?**
A: ML prediction of likelihood to stop ordering

**Q: Can I send promotions from here?**
A: Export CSV and use with email platform or use AI Promotions page

