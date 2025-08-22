# Raj Kalyan Matka - Admin Client

This is the admin panel for the Raj Kalyan Matka application, separated from the main user client.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
cd admin-client
npm install
```

### Development
```bash
npm run dev
```
The admin panel will be available at `http://localhost:3001`

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
admin-client/
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx        # Admin login/signup
│   │   ├── AdminDashboard.jsx  # Main admin dashboard
│   │   └── AdminPanel.jsx      # Admin panel interface
│   ├── context/
│   │   └── AuthContext.jsx     # Admin authentication
│   ├── App.jsx                 # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Styles
├── package.json
├── tailwind.config.js
├── vite.config.js
└── index.html
```

## 🔐 Authentication

- **Admin-only access**: Only users with `role: 'admin'` can access this panel
- **Separate authentication**: Uses the same backend but with admin-specific validation
- **Secure routes**: All admin routes are protected

## 🎨 Features

### Admin Dashboard
- **Statistics Overview**: User count, active games, bets, revenue
- **Tab Navigation**: Dashboard, Games, Results, Bets management
- **Data Tables**: Manage games, results, and user bets
- **Action Buttons**: Add, edit, delete functionality

### Admin Panel
- **Welcome Section**: Overview with key metrics
- **Menu Grid**: Administrative functions
- **Quick Actions**: Common admin tasks

## 🌐 Deployment

### Development
- **User App**: `http://localhost:3000` (rajkalyan.com)
- **Admin App**: `http://localhost:3001` (admin.rajkalyan.com)

### Production
- **User App**: `https://rajkalyan.com`
- **Admin App**: `https://admin.rajkalyan.com`

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:5000/api
```

### API Proxy
The admin client proxies API requests to the backend server running on port 5000.

## 🛡️ Security

- **Role-based access**: Only admin users can access
- **Token authentication**: JWT-based authentication
- **Protected routes**: Automatic redirect for non-admin users
- **Secure headers**: Proper CORS and security headers

## 📱 Responsive Design

- **Mobile-first**: Optimized for all screen sizes
- **Dark theme**: Consistent with main app styling
- **Modern UI**: Clean, professional interface

## 🔄 Integration

This admin client integrates with:
- **Backend API**: Same server as user app
- **Database**: Shared database with user app
- **Authentication**: Same JWT system as user app

## 🚨 Important Notes

- **Admin access only**: Regular users cannot access this panel
- **Separate deployment**: Should be deployed on separate domain
- **Shared backend**: Uses the same API as the user app
- **Role validation**: Backend validates admin privileges 