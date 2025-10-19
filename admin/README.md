# Only Coffee Admin Dashboard

A professional, beautiful admin website to control the Only Coffee mobile app. Built with React, TypeScript, and Tailwind CSS.

## 🎨 Features

### Core Management
- **Splash Screen Manager** - Control the launch modal image, title, description, and display duration
- **Carousel Manager** - Manage up to 5 promotional images on the home screen
- **Menu Items Manager** - Create, edit, and delete menu items with pricing, descriptions, and store availability
- **Images Manager** - View and manage all S3 bucket images with easy URL copying
- **Stores Manager** - Add, edit, and manage store locations with contact information

### Analytics & Insights
- **Dashboard** - Real-time overview of orders, revenue, and customer metrics
- **Analytics Page** - Detailed charts showing sales trends, category distribution, and top-selling items
- **Performance Metrics** - Track order volume, revenue, average order value, and customer satisfaction

### Admin Features
- **Authentication** - Secure login system with role-based access control
- **Settings** - Manage company information, notifications, and security settings
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running at `http://localhost:3000`

### Installation

```bash
cd admin
npm install
```

### Development

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── ImageUploader.tsx    # Image upload component
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── SplashScreenManager.tsx
│   │   ├── CarouselManager.tsx
│   │   ├── MenuItemsManager.tsx
│   │   ├── ImagesManager.tsx
│   │   ├── StoresManager.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── LoginPage.tsx
│   ├── store/
│   │   └── authStore.ts         # Authentication state management
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 🎯 Key Pages

### Dashboard
- Overview of key metrics (orders, revenue, active users, avg order value)
- Weekly orders and revenue charts
- Quick action buttons for common tasks

### Splash Screen Manager
- Upload and manage the launch modal image
- Set display duration (1-30 seconds)
- Configure start/end dates
- Preview in real-time

### Carousel Manager
- Manage up to 5 promotional images
- Drag-and-drop image upload
- Real-time preview with navigation
- Automatic carousel simulation

### Menu Items Manager
- Create, edit, and delete menu items
- Set pricing and descriptions
- Upload product images
- Select which stores carry each item
- Support for multiple categories

### Images Manager
- View all S3 bucket images
- Filter by type (Splash, Carousel, Menu Items, Stores)
- Copy image URLs to clipboard
- Download images
- Delete unused images

### Stores Manager
- Add and manage store locations
- Upload store images
- Set operating hours and contact info
- Track store status (active/inactive)
- Manage store-specific menu availability

### Analytics
- Sales trends and revenue charts
- Category distribution pie chart
- Top-selling items table
- Export data functionality
- Date range filtering

## 🔐 Authentication

Default demo credentials:
- Email: `admin@onlycoffee.us`
- Password: `demo123`

## 🎨 Design System

- **Primary Color**: #ff93a3 (Only Coffee Pink)
- **Font**: System fonts for optimal performance
- **Icons**: React Icons (Feather icons)
- **Charts**: Recharts for data visualization
- **UI Framework**: Tailwind CSS

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interface
- Adaptive layouts

## 🔗 API Integration

The admin dashboard connects to the backend API at `http://localhost:3000`:

- `POST /api/admin/login` - Admin authentication
- `PUT /api/promotions/splash` - Update splash screen
- `PUT /api/promotions/carousel` - Update carousel
- `POST /api/menu-items` - Create menu item
- `PUT /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item
- `POST /api/upload` - Upload images to S3
- `GET /api/analytics` - Fetch analytics data

## 🛠️ Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **React Icons** - Icon library
- **React Dropzone** - File uploads
- **Axios** - HTTP client

## 📦 Dependencies

See `package.json` for complete list of dependencies.

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📝 License

© 2025 Only Coffee. All rights reserved.

## 🤝 Support

For issues or questions, contact: admin@onlycoffee.us

