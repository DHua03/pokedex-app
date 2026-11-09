const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get the Authorization header from the request
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Tokens are usually sent as "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Invalid token format." });
  }

  try {
    // Verify the token using our secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the user payload (id, username) to the request object
    req.user = verified;
    
    // Move on to the actual route handler
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};