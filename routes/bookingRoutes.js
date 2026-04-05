const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode'); 

const SECRET = process.env.JWT_SECRET || "supersecretkey";

// OTP temporary storage
let cancellationOTPs = {};

// 📧 1. Nodemailer Setup (UPDATED FOR RENDER)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Render Env Variables-la irunthu varum
        pass: process.env.EMAIL_PASS  // Render Env Variables-la irunthu varum
    },
    // 🛡️ Render block pannaama iruka indha setting romba mukkiyam
    tls: {
        rejectUnauthorized: false
    }
});

// 🛡️ Middleware: Token verification
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized!" });
        req.userId = decoded.id;
        next();
    });
};

// ⚡ 2. Route: Send Booking OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    
    const otp = Math.floor(100000 + Math.random() * 900000);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Railway Ticket Booking OTP - SmartRail',
        text: `Your OTP for Railway Ticket Booking is: ${otp}. Do not share this with anyone.`
    };

    try {
        await transporter.sendMail(mailOptions);
        // Security check: Live-la OTP-ah json-la anupuradhu unsafe, but ippo unga frontend logic-ku idhu thevai
        res.status(200).json({ success: true, otp: otp });
    } catch (error) {
        console.error("Booking OTP Error:", error);
        res.status(500).json({ success: false, message: "Email sending failed. Check App Password." });
    }
});

// ⚡ 3. Route: Send Cancellation OTP
router.post('/send-cancel-otp', verifyToken, async (req, res) => {
    const { pnr } = req.body;
    if (!pnr) return res.status(400).json({ success: false, message: "PNR is required" });

    try {
        const [rows] = await db.query(
            'SELECT p.email FROM passengers p JOIN bookings b ON p.booking_id = b.id WHERE b.pnr = ? LIMIT 1', 
            [pnr]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "No booking found for this PNR" });
        }

        const targetEmail = rows[0].email;
        const otp = Math.floor(100000 + Math.random() * 900000);
        
        cancellationOTPs[pnr] = {
            otp: otp,
            expires: Date.now() + 300000 // 5 Minutes expiry
        };

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: targetEmail,
            subject: 'Ticket Cancellation OTP - SmartRail',
            text: `Your OTP to cancel PNR ${pnr} is: ${otp}. Valid for 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: "Cancellation OTP sent to registered email" });

    } catch (error) {
        console.error("Cancel OTP Error:", error);
        res.status(500).json({ success: false, message: "Failed to send cancellation OTP" });
    }
});

// 🎟️ 4. Route: Book Ticket
router.post('/book', async (req, res) => {
    const { user_id, train_id, seats, seat_numbers, passengers, paymentMethod } = req.body;

    if (!user_id || user_id === 'undefined') {
        return res.status(400).json({ success: false, message: 'Invalid User ID. Please login again.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [trains] = await connection.query('SELECT * FROM trains WHERE id = ? FOR UPDATE', [train_id]);
        if (trains.length === 0) throw new Error('Train not found');
        
        const train = trains[0];
        if (train.total_seats < seats) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Required seats not available!' });
        }

        const total_price = seats * train.price;
        const pnr = 'PNR' + Math.random().toString().slice(2, 11);
        
        const [bookingRes] = await connection.query(
            'INSERT INTO bookings (user_id, train_id, pnr, seats, seat_numbers, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, "CONFIRMED")',
            [Number(user_id), Number(train_id), pnr, Number(seats), seat_numbers.join(','), total_price, paymentMethod || 'UPI']
        );
        const bookingId = bookingRes.insertId;

        const passengerValues = passengers.map((p, index) => [
            bookingId, p.name, p.age, p.gender, seat_numbers[index], p.email, paymentMethod || 'UPI'
        ]);

        await connection.query(
            'INSERT INTO passengers (booking_id, name, age, gender, seat_number, email, payment_method) VALUES ?',
            [passengerValues]
        );

        await connection.query('UPDATE trains SET total_seats = total_seats - ? WHERE id = ?', [Number(seats), Number(train_id)]);

        await connection.commit();

        // 🎫 QR Code & PDF Generation
        const pNames = passengers.map(p => `${p.name}`).join(", ");
        const qrContent = `PNR: ${pnr} | Train: ${train.train_name} | Passengers: ${pNames}`;
        const qrImage = await QRCode.toDataURL(qrContent);

        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: passengers[0].email,
                subject: `Booking Confirmed - PNR: ${pnr}`,
                text: `Happy Journey! Your ticket for ${train.train_name} is confirmed. PNR: ${pnr}`,
                attachments: [{ filename: `SmartRail_Ticket_${pnr}.pdf`, content: pdfData }]
            };
            try { await transporter.sendMail(mailOptions); } catch (e) { console.log("Ticket Mail Error:", e); }
        });

        doc.fontSize(22).text('SMARTRAIL E-TICKET', { align: 'center', underline: true });
        doc.image(qrImage, 430, 50, { width: 100 });
        doc.moveDown().fontSize(12).text(`PNR: ${pnr}\nTrain: ${train.train_name}\nRoute: ${train.source} to ${train.destination}\nStatus: CONFIRMED`);
        doc.moveDown().text('PASSENGER DETAILS:');
        passengers.forEach((p, i) => {
            doc.text(`${i + 1}. ${p.name} - Age: ${p.age} - Seat: ${seat_numbers[i]}`);
        });
        doc.end();

        res.status(201).json({ success: true, message: 'Booking Confirmed', pnr });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Booking Error:", err);
        res.status(500).json({ success: false, message: "Database error during booking" });
    } finally {
        if (connection) connection.release();
    }
});

// ❌ 5. Route: Cancel Ticket
router.post('/cancel', verifyToken, async (req, res) => {
    const { pnr, otp } = req.body;
    
    const storedData = cancellationOTPs[pnr];
    if (!storedData || storedData.otp != otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (Date.now() > storedData.expires) {
        delete cancellationOTPs[pnr];
        return res.status(400).json({ success: false, message: 'OTP Expired' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [booking] = await connection.query('SELECT * FROM bookings WHERE pnr = ? AND user_id = ?', [pnr, req.userId]);
        if (booking.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        if (booking[0].status === 'CANCELLED') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Ticket already cancelled' });
        }

        await connection.query('UPDATE bookings SET status = "CANCELLED" WHERE pnr = ?', [pnr]);
        await connection.query('UPDATE trains SET total_seats = total_seats + ? WHERE id = ?', [booking[0].seats, booking[0].train_id]);
        
        await connection.commit();
        delete cancellationOTPs[pnr];

        res.json({ success: true, message: 'Ticket Cancelled Successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// 🔍 6. Route: Get Booked Seats
router.get('/booked/:trainId', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT seat_numbers FROM bookings WHERE train_id = ? AND status != "CANCELLED"', [req.params.trainId]);
        let bookedSeats = [];
        rows.forEach(row => { if (row.seat_numbers) bookedSeats = bookedSeats.concat(row.seat_numbers.split(',')); });
        res.status(200).json({ bookedSeats });
    } catch (err) {
        res.status(500).json({ bookedSeats: [] });
    }
});

// 🔍 7. Route: Get User Bookings
router.get('/user/:userId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT b.*, t.train_name, t.source, t.destination FROM bookings b JOIN trains t ON b.train_id = t.id WHERE b.user_id = ? ORDER BY b.booking_date DESC', 
            [req.params.userId]
        );
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

// 📄 8. Route: Download Ticket
router.get('/ticket/:pnr', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT b.*, t.train_name, t.source, t.destination, p.name AS p_name, p.age, p.seat_number
            FROM bookings b 
            JOIN trains t ON b.train_id = t.id 
            JOIN passengers p ON b.id = p.booking_id
            WHERE b.pnr = ?`, [req.params.pnr]);

        if (rows.length === 0) return res.status(404).send('Ticket not found');

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Ticket_${req.params.pnr}.pdf`);
        doc.pipe(res);

        const passList = rows.map(r => `${r.p_name}`).join(", ");
        const qrData = `PNR: ${rows[0].pnr} | Train: ${rows[0].train_name} | Passengers: ${passList}`;
        const qrImage = await QRCode.toDataURL(qrData);

        doc.fontSize(22).text('SMARTRAIL E-TICKET', { align: 'center', underline: true });
        doc.image(qrImage, 430, 50, { width: 100 }); 
        doc.moveDown().fontSize(14).text(`PNR: ${rows[0].pnr}\nTrain: ${rows[0].train_name}\nRoute: ${rows[0].source} to ${rows[0].destination}\nStatus: ${rows[0].status}`);
        
        doc.moveDown().text('Passenger Details:');
        rows.forEach((r, i) => {
            doc.text(`${i+1}. ${r.p_name} | Age: ${r.age} | Seat: ${r.seat_number}`);
        });

        doc.end();
    } catch (err) { 
        res.status(500).send('Error generating PDF'); 
    }
});

module.exports = router;