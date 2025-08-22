const jwt = require('jsonwebtoken')
const User = require('../models/User')
const AdminConfig = require('../models/AdminConfig')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if this is an admin or subadmin token
    if (decoded.role === 'admin') {
      const adminConfig = await AdminConfig.findById(decoded.userId)
      if (!adminConfig) {
        return res.status(401).json({ message: 'Invalid token. Admin not found.' })
      }

      if (!adminConfig.isActive) {
        return res.status(401).json({ message: 'Account is deactivated.' })
      }
      
      // Create user-like object for admin/subadmin
      req.user = {
        _id: adminConfig._id,
        name: adminConfig.adminName,
        mobileNumber: adminConfig.mobileNumber,
        role: adminConfig.role,
        isActive: adminConfig.isActive
      }
    } else {
      // Regular user token
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid token. User not found.' })
      }

      req.user = user
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' })
    }
    res.status(500).json({ message: 'Server error.' })
  }
}

const requireAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        console.log(`Admin access denied for user: ${req.user.name} (${req.user.mobileNumber}) - Role: ${req.user.role}`)
        return res.status(403).json({ message: 'Access denied. Admin role required.' })
      }
      next()
    })
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
}

const requireSuperAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        console.log(`Super admin access denied for user: ${req.user.name} (${req.user.mobileNumber}) - Role: ${req.user.role}`)
        return res.status(403).json({ message: 'Access denied. Super admin role required.' })
      }
      next()
    })
  } catch (error) {
    console.error('Super admin middleware error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
}

const requireAdminOrSubAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!['admin', 'subadmin'].includes(req.user.role)) {
        console.log(`Admin/SubAdmin access denied for user: ${req.user.name} (${req.user.mobileNumber}) - Role: ${req.user.role}`)
        return res.status(403).json({ message: 'Access denied. Admin or SubAdmin role required.' })
      }
      next()
    })
  } catch (error) {
    console.error('Admin/SubAdmin middleware error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
}

const requireActiveUser = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated. Please contact support for assistance.' })
      }
      next()
    })
  } catch (error) {
    console.error('Active user middleware error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
}

module.exports = {
  auth,
  requireActiveUser,
  requireAdmin,
  requireSuperAdmin,
  requireAdminOrSubAdmin
}