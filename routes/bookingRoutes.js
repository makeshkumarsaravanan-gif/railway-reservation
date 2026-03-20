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

// 📧 1. Nodemailer Setup (SECURED)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // .env file la irunthu varum
        pass: process.env.EMAIL_PASS  // .env file la irunthu varum
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

// ⚡ 2. Route: Send Booking OTP (Initial booking process)
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const otp = Math.floor(100000 + Math.random() * 900000);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Railway Ticket Booking OTP',
        text: `Your OTP for Railway Ticket Booking is: ${otp}. Do not share this with anyone.`
    };
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, otp: otp });
    } catch (error) {
        res.status(500).json({ success: false, message: "Email failed" });
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
            return res.status(404).json({ success: false, message: "No booking found" });
        }

        const targetEmail = rows[0].email;
        const otp = Math.floor(100000 + Math.random() * 900000);
        
        cancellationOTPs[pnr] = {
            otp: otp,
            expires: Date.now() + 300000 
        };

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: targetEmail,
            subject: 'Ticket Cancellation OTP - SmartRail',
            text: `Your OTP to cancel PNR ${pnr} is: ${otp}. Valid for 5 minutes.`
        };

        // ✅ IMPORTANT: Wait for mail and then RETURN response
        await transporter.sendMail(mailOptions);
        
        // Frontend-ku success signal anupuroam
        return res.status(200).json({ 
            success: true, 
            message: "OTP sent successfully" 
        });

    } catch (error) {
        console.error("Mail Error:", error);
        // Error vanthaalum return pannanum
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Failed to send OTP email" });
        }
    }
});

// 🎟️ 4. Route: Book Ticket
router.post('/book', async (req, res) => {
    const { user_id, train_id, seats, seat_numbers, passengers, paymentMethod } = req.body;

    if (!user_id || user_id === 'undefined') {
        return res.status(400).json({ success: false, message: 'Invalid User ID' });
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
            return res.status(400).json({ success: false, message: 'Seats full!' });
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

        // ⭐ UPDATED QR LOGIC - ADDED FULL DETAILS ⭐
        const pNames = passengers.map(p => `${p.name}(${p.age})`).join(", ");
        const qrContent = `PNR: ${pnr}\nTrain: ${train.train_name}\nRoute: ${train.source}-${train.destination}\nTravelers: ${pNames}`;
        const qrImage = await QRCode.toDataURL(qrContent);

        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: passengers[0].email,
                subject: `Ticket Confirmed - PNR: ${pnr}`,
                text: `Ticket Confirmed! PNR: ${pnr}\nTrain: ${train.train_name}`,
                attachments: [{ filename: `Ticket_${pnr}.pdf`, content: pdfData }]
            };
            try { await transporter.sendMail(mailOptions); } catch (e) { console.log("Mail error", e); }
        });

        doc.fontSize(22).text('RAILWAY E-TICKET', { align: 'center', underline: true });
        doc.image(qrImage, 430, 50, { width: 100 });
        doc.moveDown().fontSize(12).text(`PNR: ${pnr}\nTrain: ${train.train_name}\nStatus: CONFIRMED`);
        doc.moveDown().text('PASSENGER DETAILS:');
        passengers.forEach((p, i) => {
            doc.text(`${i + 1}. ${p.name} - Age: ${p.age} - Seat: ${seat_numbers[i]}`);
        });
        doc.end();

        res.status(201).json({ success: true, message: 'Booking Confirmed', pnr });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// ❌ 5. Route: Cancel Ticket (Verifies OTP)
router.post('/cancel', verifyToken, async (req, res) => {
    const { pnr, otp } = req.body;
    
    // OTP verification
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
            return res.status(400).json({ success: false, message: 'Already Cancelled' });
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
        res.status(500).json({ message: "Error" });
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

        // ⭐ UPDATED QR DATA: ADDED ROUTE AND PASSENGERS ⭐
        const passList = rows.map(r => `${r.p_name}(${r.age})`).join(", ");
        const qrData = `PNR: ${rows[0].pnr}\nTrain: ${rows[0].train_name}\nRoute: ${rows[0].source} to ${rows[0].destination}\nPassengers: ${passList}`;
        const qrImage = await QRCode.toDataURL(qrData);

        doc.fontSize(22).text('RAILWAY E-TICKET', { align: 'center', underline: true });
        doc.image(qrImage, 430, 50, { width: 100 }); 
        doc.moveDown().fontSize(14).text(`PNR: ${rows[0].pnr}\nTrain: ${rows[0].train_name}\nStatus: ${rows[0].status}`);
        
        // Adding detailed passenger list to PDF for clarity
        doc.moveDown().text('Passenger Details:');
        rows.forEach((r, i) => {
            doc.text(`${i+1}. ${r.p_name} | Age: ${r.age} | Seat: ${r.seat_number}`);
        });

        doc.end();
    } catch (err) { 
        res.status(500).send('Error'); 
    }
});

module.exports = router;