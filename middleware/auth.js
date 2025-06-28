const { getAuth } = require('firebase/auth');

const auth = getAuth();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Continue without user info
    }
  }
  
  next();
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid admin token' 
    });
  }
};

// Blood bank authentication middleware
const authenticateBloodBank = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is blood bank
    if (decodedToken.role !== 'bloodBank') {
      return res.status(403).json({ 
        success: false,
        error: 'Blood bank access required' 
      });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Blood bank token verification failed:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid blood bank token' 
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateAdmin,
  authenticateBloodBank
}; 
