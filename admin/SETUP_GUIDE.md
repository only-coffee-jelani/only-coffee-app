# Only Coffee Admin Dashboard - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd admin
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The admin dashboard will be available at: **http://localhost:5173**

### 3. Login

Use the demo credentials:
- **Email**: admin@onlycoffee.us
- **Password**: demo123

## Backend API Setup

The admin dashboard requires the backend API to be running. Make sure your backend is configured:

### Backend Requirements

1. **API Server**: Running at `http://localhost:3000`
2. **Database**: Connected to AWS RDS PostgreSQL
3. **S3 Bucket**: `only-coffee-assets` configured for image uploads
4. **Authentication**: JWT tokens for admin access

### Required Backend Endpoints

```
POST   /api/admin/login                    - Admin login
PUT    /api/promotions/splash              - Update splash screen
PUT    /api/promotions/carousel            - Update carousel
POST   /api/menu-items                     - Create menu item
PUT    /api/menu-items/:id                 - Update menu item
DELETE /api/menu-items/:id                 - Delete menu item
GET    /api/menu-items                     - List menu items
POST   /api/stores                         - Create store
PUT    /api/stores/:id                     - Update store
DELETE /api/stores/:id                     - Delete store
GET    /api/stores                         - List stores
POST   /api/upload                         - Upload image to S3
GET    /api/analytics                      - Get analytics data
```

## Features Overview

### 1. Dashboard
- Real-time metrics (orders, revenue, users)
- Weekly sales charts
- Quick action buttons

### 2. Splash Screen Manager
- Upload launch modal image
- Set display duration
- Configure active dates
- Real-time preview

### 3. Carousel Manager
- Manage up to 5 promotional images
- Drag-and-drop upload
- Live preview with navigation
- Auto-scroll simulation

### 4. Menu Items Manager
- Create/edit/delete products
- Set pricing and descriptions
- Upload product images
- Select stores for each item
- Multiple categories support

### 5. Images Manager
- View all S3 images
- Filter by type
- Copy URLs
- Download images
- Delete unused images

### 6. Stores Manager
- Add/edit/delete locations
- Upload store images
- Manage contact info
- Track store status
- Store-specific menu management

### 7. Analytics
- Sales trends
- Revenue charts
- Category distribution
- Top-selling items
- Export functionality

### 8. Settings
- Company information
- Notification preferences
- Security settings
- Password management

## Color Theme

The admin dashboard uses the Only Coffee brand color:
- **Primary Color**: #ff93a3 (Pink)
- **Secondary**: Grays and whites for clean interface
- **Accent**: Pink highlights for interactive elements

## File Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── ImageUploader.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── SplashScreenManager.tsx
│   │   ├── CarouselManager.tsx
│   │   ├── MenuItemsManager.tsx
│   │   ├── ImagesManager.tsx
│   │   ├── StoresManager.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── LoginPage.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Development Tips

### Hot Module Replacement (HMR)
Changes to files are automatically reflected in the browser without full page reload.

### TypeScript
Full TypeScript support for type safety and better IDE support.

### Tailwind CSS
Utility-first CSS framework for rapid UI development.

### State Management
Zustand for lightweight, efficient state management.

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

## Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the dist/ folder to Netlify
```

### Docker
```bash
docker build -t only-coffee-admin .
docker run -p 5173:5173 only-coffee-admin
```

### Traditional Server
```bash
npm run build
# Copy dist/ folder to your web server
```

## Environment Variables

Create a `.env` file in the admin directory:

```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Only Coffee Admin
VITE_BRAND_COLOR=#ff93a3
```

## Troubleshooting

### Port Already in Use
If port 5173 is already in use:
```bash
npm run dev -- --port 3001
```

### API Connection Issues
- Ensure backend is running at `http://localhost:3000`
- Check CORS configuration in backend
- Verify authentication token is valid

### Image Upload Fails
- Check S3 bucket permissions
- Verify AWS credentials in backend
- Ensure bucket CORS is configured

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Performance Optimization

- Images are lazy-loaded
- Charts use efficient rendering
- State updates are optimized
- CSS is minified in production
- JavaScript is tree-shaken

## Security

- JWT authentication for admin access
- Secure token storage in localStorage
- HTTPS recommended for production
- Input validation on all forms
- CORS protection

## Support

For issues or questions:
- Email: admin@onlycoffee.us
- Documentation: See README.md
- Backend API: http://localhost:3000/api/docs

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Login with demo credentials
4. ✅ Explore the dashboard
5. ✅ Start managing your app!

Happy managing! ☕

