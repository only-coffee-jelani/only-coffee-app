# Only Coffee Admin Dashboard - Implementation Guide

## 📋 Overview

This guide explains how to implement the admin dashboard with your backend API.

## 🔧 Backend API Requirements

### Authentication Endpoint
```
POST /api/admin/login
Request:
{
  "email": "admin@onlycoffee.us",
  "password": "password"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@onlycoffee.us",
    "role": "admin"
  }
}
```

### Promotions Endpoints
```
PUT /api/promotions/splash
Request:
{
  "title": "Fall Special",
  "description": "Try our new Waffolino",
  "imageUrl": "https://...",
  "displayDuration": 3,
  "startDate": "2025-10-01",
  "endDate": "2025-12-31",
  "isActive": true
}

PUT /api/promotions/carousel
Request:
{
  "images": [
    { "id": 1, "url": "https://...", "title": "Image 1" },
    ...
  ]
}
```

### Menu Items Endpoints
```
POST /api/menu-items
GET /api/menu-items
PUT /api/menu-items/:id
DELETE /api/menu-items/:id

Request Body:
{
  "name": "Cappuccino",
  "category": "Coffee",
  "description": "Espresso with steamed milk",
  "price": 4.50,
  "imageUrl": "https://...",
  "stores": [1, 2, 3]
}
```

### Stores Endpoints
```
POST /api/stores
GET /api/stores
PUT /api/stores/:id
DELETE /api/stores/:id

Request Body:
{
  "name": "Downtown",
  "address": "123 Main St",
  "city": "New Orleans",
  "state": "LA",
  "zipCode": "70112",
  "phone": "(504) 123-4567",
  "email": "downtown@onlycoffee.us",
  "imageUrl": "https://...",
  "isActive": true
}
```

### Image Upload Endpoint
```
POST /api/upload
Content-Type: multipart/form-data

Form Data:
- file: File object
- folder: "promotions" | "menu-items" | "stores"

Response:
{
  "url": "https://only-coffee-assets.s3.us-east-1.amazonaws.com/..."
}
```

### Analytics Endpoint
```
GET /api/analytics?range=week|month|year

Response:
{
  "totalOrders": 442,
  "totalRevenue": 12100,
  "activeUsers": 1234,
  "avgOrderValue": 27.35,
  "orderData": [...],
  "categoryData": [...],
  "topItems": [...]
}
```

## 🔌 Integration Steps

### 1. Update API Base URL
Edit `src/store/authStore.ts` and all API calls to use your backend URL:

```typescript
const API_BASE = 'http://localhost:3000'; // or your production URL
```

### 2. Implement Authentication
The `authStore.ts` already handles JWT tokens. Ensure your backend returns:
- `token`: JWT token for subsequent requests
- `user`: User object with id, email, role

### 3. Add Authorization Headers
All API calls should include the token:

```typescript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
}
```

### 4. Implement Each Endpoint
Update the API calls in each page component to match your backend.

### 5. Error Handling
The app uses `react-hot-toast` for notifications. Ensure proper error responses:

```typescript
if (!response.ok) {
  throw new Error('API Error');
}
```

## 📝 Database Schema

### Promotions Table
```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  promotion_type VARCHAR(50),
  image_url VARCHAR(500) NOT NULL,
  target_menu_item_id UUID,
  target_url VARCHAR(500),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  display_duration INTEGER,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Menu Items Table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  base_price DECIMAL(10, 2),
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stores Table
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment Checklist

- [ ] Backend API is running and accessible
- [ ] Database tables are created
- [ ] S3 bucket is configured
- [ ] CORS is enabled on backend
- [ ] JWT authentication is working
- [ ] All endpoints are implemented
- [ ] Error handling is in place
- [ ] Admin credentials are set
- [ ] Environment variables are configured
- [ ] Build is successful: `npm run build`
- [ ] Production build is tested
- [ ] Deployment platform is ready

## 🔐 Security Considerations

1. **HTTPS Only** - Use HTTPS in production
2. **Token Expiry** - Implement token refresh
3. **CORS** - Configure CORS properly
4. **Input Validation** - Validate all inputs
5. **Rate Limiting** - Implement rate limiting
6. **Admin Verification** - Verify admin status
7. **Audit Logging** - Log all admin actions
8. **Password Policy** - Enforce strong passwords

## 📊 Performance Optimization

1. **Image Optimization** - Compress images before upload
2. **Lazy Loading** - Load data on demand
3. **Caching** - Cache frequently accessed data
4. **Pagination** - Paginate large datasets
5. **Debouncing** - Debounce search inputs
6. **Code Splitting** - Split code for faster loading

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
Test API endpoints with Postman or similar tool.

### E2E Tests
Test complete workflows in the browser.

## 📱 Mobile Testing

- Test on iPhone and Android
- Test on tablets
- Test touch interactions
- Test responsive layouts

## 🐛 Troubleshooting

### API Connection Issues
- Check backend is running
- Verify API URL is correct
- Check CORS configuration
- Verify network connectivity

### Authentication Issues
- Check JWT token is valid
- Verify token is stored correctly
- Check token expiry
- Verify admin credentials

### Image Upload Issues
- Check S3 bucket permissions
- Verify AWS credentials
- Check file size limits
- Verify file format

## 📞 Support

For implementation help:
- Email: admin@onlycoffee.us
- Documentation: See README.md
- API Docs: http://localhost:3000/api/docs

## ✅ Next Steps

1. Implement all backend endpoints
2. Test API integration
3. Deploy admin dashboard
4. Train admin users
5. Monitor performance
6. Gather feedback
7. Iterate and improve

---

**Implementation Status**: Ready for Integration ✅

