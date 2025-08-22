# Raj Kalyan Matka - User Client

This is the main user-facing application for the Raj Kalyan Matka platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
cd client
npm install
```

### Development
```bash
npm run dev
```
The user app will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
client/
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx    # User login/signup
│   │   └── Dashboard.jsx   # User dashboard
│   ├── components/
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── context/
│   │   └── AuthContext.jsx     # User authentication
│   ├── App.jsx                 # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Styles
├── public/
│   └── logo.jpg              # App logo
├── package.json
├── tailwind.config.js
├── vite.config.js
└── index.html
```

## 🔐 Authentication

- **User registration**: Sign up with name, mobile number, and password
- **User login**: Sign in with mobile number and password
- **Password visibility**: Toggle to show/hide passwords
- **Secure routes**: All user routes are protected

## 🎨 Features

### User Dashboard
- **Sidebar Navigation**: Collapsible sidebar with user info and menu
- **Game Grid**: Display of available games with open/close times
- **Action Buttons**: WhatsApp contact and Starline information
- **Responsive Design**: Works on all screen sizes

### User Authentication
- **Login/Signup**: Single page for both authentication modes
- **Form Validation**: Client-side validation for all inputs
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during authentication

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
The user client proxies API requests to the backend server running on port 5000.

## 🛡️ Security

- **Token authentication**: JWT-based authentication
- **Protected routes**: Automatic redirect for unauthenticated users
- **Role-based redirects**: Admin users are redirected to admin panel
- **Secure headers**: Proper CORS and security headers

## 📱 Responsive Design

- **Mobile-first**: Optimized for all screen sizes
- **Dark theme**: Consistent styling throughout
- **Modern UI**: Clean, professional interface
- **Sidebar functionality**: Collapsible navigation

## 🔄 Integration

This user client integrates with:
- **Backend API**: Same server as admin app
- **Database**: Shared database with admin app
- **Authentication**: Same JWT system as admin app

## 🚨 Important Notes

- **User-only access**: Admin users are redirected to admin panel
- **Separate from admin**: Admin functionality is in separate app
- **Shared backend**: Uses the same API as the admin app
- **Role validation**: Backend validates user privileges

## 🎯 User Flow

1. **Landing**: Users land on authentication page
2. **Signup/Login**: Users create account or sign in
3. **Dashboard**: Users access their personalized dashboard
4. **Games**: Users can view available games and place bets
5. **Navigation**: Users can access different sections via sidebar

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Technologies
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client for API calls
- **React Hot Toast**: User notifications
- **Vite**: Fast build tool 