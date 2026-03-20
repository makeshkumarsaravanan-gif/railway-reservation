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

// ✅ Cross-Origin Resource Sharing
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ✅ Serving the Frontend (HTML/CSS/JS files must be inside the 'client' folder)
app.use(express.static(path.join(__dirname, 'client')));

// ✅ Routes Mapping
app.use("/api/auth", authRoute);
app.use("/api/users", userRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ Default route to load the Welcome page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// ✅ Cleaned up Localhost Binding (Removed Ngrok logic)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n======================================`);
    console.log(`🚀 SmartRail Server is RUNNING!`);
    console.log(`💻 Open in Browser: http://localhost:${PORT}`);
    console.log(`======================================\n`);
});