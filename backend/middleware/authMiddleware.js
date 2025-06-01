const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;  // attach userId to request
    next();
  } catch (err) {
    console.log(err)
    res.status(401).json({ message: 'Invalid Token' });
  }
};

module.exports = verifyToken;