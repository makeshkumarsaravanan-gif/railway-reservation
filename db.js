require("dotenv").config();
const mysql = require("mysql2/promise");

// Database Pool Configuration
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Connection Test (Self-invoking async function)
(async () => {
    try {
        const connection = await db.getConnection();
        console.log("✅ Database Connected Successfully to:", process.env.DB_NAME);
        connection.release(); // Romba mukkiyam! Connection-ah pool-kulla thirumbi anupirunm.
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
    }
})();

module.exports = db;