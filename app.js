const express = require("express");
const cors = require("cors");
const path = require("path"); 
require("dotenv").config();

// Routes Import
const userRoutes = require("./routes/userRoutes");
const trainRoutes = require("./routes/trainRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoute = require("./routes/authRoute");  

const app = express(); 

// ✅ 1. CORS Configuration (Render-ku idhu romba mukkiyam)
app.use(cors());

// ✅ 2. Middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ✅ 3. Serving the Frontend
// 'client' folder-kulla dhaan unga html files irukanum
app.use(express.static(path.join(__dirname, 'client')));

// ✅ 4. API Routes Mapping
app.use("/api/auth", authRoute);
app.use("/api/users", userRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ 5. Default route (Welcome page)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Express 6 catch-all (Catch everything)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});
// ✅ 7. Render/Local Port Binding
// Render-la port 0.0.0.0-la listen pannanum
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================`);
    console.log(`🚀 SmartRail Server is LIVE!`);
    console.log(`📡 Listening on Port: ${PORT}`);
    console.log(`======================================\n`);
});