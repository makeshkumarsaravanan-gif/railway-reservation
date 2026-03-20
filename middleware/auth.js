const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

function verifyToken(req, res, next) {
    // 1. Get header (Express way)
    const authHeader = req.header('Authorization');

    // 2. Check if header exists
    if (!authHeader) {
        return res.status(403).json({ success: false, message: 'Access Denied: No Token Provided' });
    }

    // 3. Extract token (Bearer <token>)
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
        return res.status(403).json({ success: false, message: 'Invalid Token Format' });
    }

    try {
        // 4. Verify & Decode
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // 5. Attach info to request (Standard & Legacy support)
        req.user = decoded; 
        req.user_id = decoded.id || decoded.user_id; 
        req.email = decoded.email; // OTP send panna idhu thevai
        
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: err.name === 'TokenExpiredError' ? 'Token Expired! Please login again.' : 'Invalid Token' 
        });
    }
}

module.exports = verifyToken;