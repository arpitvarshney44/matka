const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const adminRoutes = require('./routes/admin')
const howToPlayRoutes = require('./routes/howToPlay')
const contactSettingsRoutes = require('./routes/contactSettings')
const enquiryRoutes = require('./routes/enquiry')
const adminConfigRoutes = require('./routes/adminConfig')
const autoActiveRoutes = require('./routes/autoActive')
const userManagementRoutes = require('./routes/userManagement')
const subAdminManagementRoutes = require('./routes/subAdminManagement')
const bannerSettingsRoutes = require('./routes/bannerSettings')
const mainSettingsRoutes = require('./routes/mainSettings')
const qrSettingsRoutes = require('./routes/qrSettings')
const gamesRoutes = require('./routes/games')
const starlineGamesRoutes = require('./routes/starlineGames')
const starlineBetsRoutes = require('./routes/starlineBets')
const starlineResultsRoutes = require('./routes/starlineResults')
const starlineGameRatesRoutes = require('./routes/starlineGameRates')
const starlineReportsRoutes = require('./routes/starlineReports')

const gameRatesRoutes = require('./routes/gameRates')
const withdrawRoutes = require('./routes/withdraw')
const fundRequestRoutes = require('./routes/fundRequest')
const betsRoutes = require('./routes/bets')
const resultsSessionRoutes = require('./routes/resultsSession')

const app = express()



// Strict allowed origins
const ALLOWED_ORIGINS = [
  'https://rajkalyan.in',
  'https://admin.rajkalyan.in',


]

// Middleware
app.use(helmet())
// app.use(morgan('combined')) // Disabled to reduce log verbosity
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      // Block requests without Origin header to avoid permissive cross-origin
      return callback(new Error('Origin header required by CORS'))
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }
    console.log(`CORS blocked origin: ${origin}`)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/matkagameapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB')
  
  // Using fund request system instead of automatic payment verification
})
.catch(err => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/how-to-play', howToPlayRoutes)
app.use('/api/contact-settings', contactSettingsRoutes)
app.use('/api/enquiry', enquiryRoutes)
app.use('/api/admin-config', adminConfigRoutes)
app.use('/api/auto-active', autoActiveRoutes)
app.use('/api/user-management', userManagementRoutes)
app.use('/api/sub-admin-management', subAdminManagementRoutes)
app.use('/api/banner-settings', bannerSettingsRoutes)
app.use('/api/main-settings', mainSettingsRoutes)
app.use('/api/qr-settings', qrSettingsRoutes)
app.use('/api/games', gamesRoutes)
app.use('/api/starline/games', starlineGamesRoutes)
app.use('/api/starline/bets', starlineBetsRoutes)
app.use('/api/starline/results', starlineResultsRoutes)
app.use('/api/starline/gamerates', starlineGameRatesRoutes)
app.use('/api/starline/reports', starlineReportsRoutes)
app.use('/api/gamerates', gameRatesRoutes)
app.use('/api/withdraw', withdrawRoutes)
app.use('/api/fund-request', fundRequestRoutes)
app.use('/api/bets', betsRoutes)
app.use('/api/results-session', resultsSessionRoutes)

// Serve static files from uploads directory with strict CORS
app.use(
  '/uploads',
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(new Error('Origin header required by CORS'))
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      console.log(`CORS blocked origin on /uploads: ${origin}`)
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: false,
  }),
  express.static(path.join(__dirname, 'uploads'))
)

// API route for checking client type
app.get('/api/client-info', (req, res) => {
  const origin = req.get('Origin')
  const isAdminClient = origin && origin.includes('3001') || origin && origin.includes('admin.rajkalyan.com')
  
  res.json({
    clientType: isAdminClient ? 'admin' : 'user',
    origin: origin,
    timestamp: new Date().toISOString()
  })
})

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MatkaGameApp API is running',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})