# Raj Kalyan Matka Server

Backend server for the Raj Kalyan Matka application built with Express.js, MongoDB, and JWT authentication. Supports both user and admin clients.

## Features

- User authentication (signup/login) with JWT
- Role-based access control (user/admin)
- Separate admin and user client support
- User management (admin only)
- Game management (admin only)
- Bet management (admin only)
- Result management (admin only)
- Profile management
- MongoDB integration with Mongoose
- Input validation with express-validator
- Security middleware (helmet, cors)
- Admin user management scripts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/matkagameapp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
USER_CLIENT_URL=http://localhost:3000
ADMIN_CLIENT_URL=http://localhost:3001
```

4. Start MongoDB service

5. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Client Architecture

The application supports two separate clients:

- **User Client** (`http://localhost:3000`): Main user interface for betting and game participation
- **Admin Client** (`http://localhost:3001`): Administrative interface for managing games, users, and results

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user (user client only)
- `POST /api/auth/login` - Login user (validates admin access for admin client)
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/me` - Get current user (protected, alias for profile)
- `GET /api/client-info` - Get client type information

### User Management

- `GET /api/user/profile` - Get current user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)
- `GET /api/user/all` - Get all users (admin only)
- `PUT /api/user/:id/role` - Update user role (admin only)
- `PUT /api/user/:id/status` - Toggle user status (admin only)

### Admin Management

- `GET /api/admin/dashboard` - Get admin dashboard statistics (admin only)
- `GET /api/admin/overview` - Get admin overview data (admin only)
- `GET /api/admin/games` - Get all games (admin only)
- `POST /api/admin/games` - Create new game (admin only)
- `PUT /api/admin/games/:id` - Update game (admin only)
- `DELETE /api/admin/games/:id` - Delete game (admin only)
- `POST /api/admin/games/:id/results` - Declare game result (admin only)
- `GET /api/admin/results` - Get all results (admin only)
- `GET /api/admin/bets` - Get all bets (admin only)

### Health Check

- `GET /api/health` - Server health check

## Database Schema

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  mobileNumber: String (required, unique, 10 digits),
  password: String (required, min 6 chars, hashed),
  role: String (enum: 'user', 'admin', default: 'user'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  timestamps: true
}
```

## Admin User Management

Use the admin management script to create and manage admin users:

```bash
# Create new admin user
node scripts/manage-admin.js create "Admin Name" "1234567890" "password123"

# List all admin users
node scripts/manage-admin.js list

# Deactivate admin user
node scripts/manage-admin.js deactivate "1234567890"

# Activate admin user
node scripts/manage-admin.js activate "1234567890"

# Change admin password
node scripts/manage-admin.js password "1234567890" "newpassword123"
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- CORS protection with origin validation
- Helmet security headers
- Role-based access control
- Admin-only route protection
- Client origin validation for admin access

## Error Handling

The API returns consistent error responses:
```javascript
{
  message: "Error description",
  errors: [] // Validation errors if any
}
```

## Development

- Uses nodemon for auto-restart in development
- Morgan for request logging
- Environment-based configuration
- Comprehensive error handling 