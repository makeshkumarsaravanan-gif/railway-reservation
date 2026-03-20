const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ FIXED PATH: routes folder-la irundhu veliya vandhu middleware folder-kulla pogudhu
const verifyToken = require('../middleware/auth'); 

// ----------------------------
// 🔍 1. Search trains with Advanced Filtering
// ----------------------------
router.get('/search', verifyToken, async (req, res, next) => {
    let { source, destination, time, date } = req.query;

    if (!source || !destination) {
        return res.status(400).json({ success: false, message: 'Source & Destination required' });
    }

    // SQL Query construction
    let query = 'SELECT * FROM trains WHERE LOWER(source) = ? AND LOWER(destination) = ?';
    const params = [source.trim().toLowerCase(), destination.trim().toLowerCase()];

    // Optional: Date filtering
    if (date) {
        query += ' AND DATE(departure_time) = ?';
        params.push(date);
    }

    // ⭐ LOGIC FIXED: Frontend match aagura maari 3 slots
    const timeSlots = {
        morning: " AND TIME(departure_time) BETWEEN '05:00:00' AND '11:59:59'",
        afternoon: " AND TIME(departure_time) BETWEEN '12:00:00' AND '16:59:59'",
        night: " AND (TIME(departure_time) BETWEEN '17:00:00' AND '23:59:59' OR TIME(departure_time) BETWEEN '00:00:00' AND '04:59:59')"
    };

    if (time && timeSlots[time]) {
        query += timeSlots[time];
    }

    try {
        const [results] = await db.query(query, params);
        res.json({ success: true, count: results.length, data: results });
    } catch (err) {
        next(err);
    }
});

// ----------------------------
// 📋 2. Get all trains (Used for Dropdowns)
// ----------------------------
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const [results] = await db.query('SELECT DISTINCT source, destination FROM trains ORDER BY source ASC');
        res.json({ success: true, data: results });
    } catch (err) {
        next(err);
    }
});

// ----------------------------
// 🚂 3. Get single train by ID (Used for Booking Page)
// ----------------------------
router.get('/:id', verifyToken, async (req, res, next) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM trains WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Train not found' });
        }
        res.json({ success: true, data: results[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;