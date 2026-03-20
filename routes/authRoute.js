const express = require('express');
const router = express.Router();
const db = require('../db'); // Unga db.js connection pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ FIXED PATH: routes-la irundhu veliya vandhu middleware folder-kulla pogudhu
const verifyToken = require('../middleware/auth'); 

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

// 📝 User Registration (No Token Needed)
router.post('/register', async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, Email, and Password are required' });
    }
    try {
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword]
        );
        res.status(201).json({ 
            success: true, 
            message: 'User Registered Successfully',
            userId: result.insertId 
        });
    } catch (error) { next(error); }
});

// 🔑 User Login (No Token Needed)
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email & Password required' });
    }
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            SECRET, 
            { expiresIn: '2h' }
        );
        res.json({ 
            success: true,
            message: 'Login Successful', 
            token, 
            user: { id: user.id, name: user.name, email: user.email } 
        });
    } catch (error) { next(error); }
});

// ⭐ SECURED: RESET PASSWORD VIA OTP ⭐
router.post('/reset-password', verifyToken, async (req, res, next) => {
    const userId = req.user.id || req.user_id; 
    const { newPass } = req.body;

    if (!newPass) {
        return res.status(400).json({ message: 'New Password is required' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPass, salt);

        const [result] = await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ success: true, message: 'Password updated successfully! ✅' });

    } catch (error) {
        next(error);
    }
});

// ⭐ SECURED: CHANGE PASSWORD ⭐
router.post('/change-password', verifyToken, async (req, res, next) => {
    const userId = req.user.id || req.user_id;
    const { oldPass, newPass } = req.body;
    
    if (!oldPass || !newPass) return res.status(400).json({ message: 'Both old and new passwords are required' });

    try {
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const isMatch = await bcrypt.compare(oldPass, users[0].password);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPass, salt);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        res.json({ success: true, message: 'Password updated successfully!' });
    } catch (error) { next(error); }
});

module.exports = router;