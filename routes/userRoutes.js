const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");
const verifyToken = require("../middleware/auth"); // Unga global middleware-ah use panrom

// 📧 Nodemailer Setup (Strictly from .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // Hardcoded values-a thookiyachu. Kandippa .env file-la idha set pannanum!
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

/* ==========================================
   1. GET USER PROFILE
============================================= */
router.get("/profile", verifyToken, async (req, res, next) => {
    try {
        // req.user_id verifyToken-la irundhu varum
        const [user] = await db.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [req.user_id]);
        if (user.length === 0) return res.status(404).json({ message: "User not found" });
        res.json({ success: true, data: user[0] });
    } catch (error) {
        next(error);
    }
});

/* ==========================================
   2. UPDATE USER PROFILE
============================================= */
router.put("/update-profile", verifyToken, async (req, res, next) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    try {
        await db.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user_id]);
        res.json({ success: true, message: "Profile updated successfully!", newName: name });
    } catch (error) {
        next(error);
    }
});

/* ==========================================
   3. SEND REAL OTP (Email Integration)
============================================= */
router.post("/send-otp", verifyToken, async (req, res) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    // Note: auth.js middleware-la req.email set aagi irukka nu confirm pannikonga.
    // Oruvela req.user object kulla anupirundha, `req.user.email` nu maathikonga.
    const userEmail = req.email || req.user.email; 

    if (!userEmail) return res.status(400).json({ success: false, message: "Email not found in token" });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Railway Portal - Verification OTP',
        text: `Your OTP for profile verification is: ${otp}. Do not share this with anyone.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${userEmail} successfully.`);
        
        // 🚨 SECURED: OTP-a response-la anuppakoodadhu!
        res.json({ 
            success: true, 
            message: "OTP sent to your registered email!" 
        });
    } catch (error) {
        console.error("Mail Send Error:", error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
});

/* ==========================================
   4. GET USER BOOKINGS (Detailed History)
============================================= */
router.get("/my-bookings", verifyToken, async (req, res, next) => {
    try {
        const query = `
            SELECT b.id, b.pnr, b.seats, b.total_price, b.status, b.booking_date, 
                   t.train_name, t.source, t.destination, t.departure_time
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC`;

        const [bookings] = await db.query(query, [req.user_id]);
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        next(error);
    }
});

module.exports = router;