const jwt = require('jsonwebtoken');

const verifyFaculty = (req, res, next) => {
  console.log("\n  MIDDLEWARE: AUTH CHECK ");
  
  // 1. Try to grab the token from cookies FIRST
  let token = req.cookies?.token; 
  console.log("Cookie Token found:", token ? "YES (hidden for safety)" : "NO");

  // Fallback to Header (Postman/Testing)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    console.log(" Header Token found: YES");
  }
  
  // 2. If no token is found in either place, block them
  if (!token) {
    console.log(" Result: 401 - No Token Provided");
    return res.status(401).json({ success: false, message: "Access Denied. No token provided." });
  }

  try {
    // 3. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Result: Token Verified for User ID:", decoded.id);

    // 4. Attach the decoded user data to the request
    req.user = decoded;

    // 5. If they aren't faculty, kick them out
    if (req.user.role !== 'faculty') {
      console.log("Result: 403 - User is not Faculty (Role:", req.user.role, ")");
      return res.status(403).json({ success: false, message: "Access Denied. Faculty only." });
    }

    // 6. Token is good!
    next(); 
  } catch (err) {
    console.log("Result: 401 - JWT Error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid or Expired Token." });
  }
};

module.exports = { verifyFaculty };