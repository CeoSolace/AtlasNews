const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware verifies a JWT passed via the Authorization
 * header.  If valid, it attaches the user object (without the password)
 * to the request.  Otherwise it responds with HTTP 401.  The JWT secret
 * must be defined in the environment via JWT_SECRET.  Tokens expire
 * according to the sign options defined in the auth controller.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware restricts access to specific roles.  Accepts
 * multiple roles and checks the authenticated user’s role against the
 * allowed list.  Responds with HTTP 403 if the user lacks permission.
 *
 * Usage: app.get('/admin', authenticate, authorize('admin'), handler)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };