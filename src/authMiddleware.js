function ensureAdmin(req, res, next) {
    // Assuming user role is stored in req.user.role
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
  
  function ensureSubscriptionActive(req, res, next) {
    // Assuming user subscription status is stored in req.user.subscriptionActive
    if (req.user && req.user.subscriptionActive) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
  
  function ensureAdminOrSubscriptionActive(req, res, next) {
    if (req.user && (req.user.role === 'admin' || req.user.subscriptionActive)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
  
  module.exports = {
    ensureAdmin,
    ensureSubscriptionActive,
    ensureAdminOrSubscriptionActive,
  };
  