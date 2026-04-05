require("dotenv").config();
const mysql = require("mysql2/promise");

// TiDB Cloud Configuration
const db = mysql.createPool({
    host: process.env.DB_HOST,      // e.g., gateway01.ap-southeast-1.prod.aws.tidbcloud.com
    user: process.env.DB_USER,      // e.g., xxxxxxxx.root
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000, // TiDB default port 4000
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // 🛡️ TiDB Cloud-ku indha SSL setting romba mukkiyam
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false // Render-la certificate errors thavirkka idhu help pannum
    }
});

// Connection Test
(async () => {
    try {
        const connection = await db.getConnection();
        console.log("✅ TiDB Cloud Connected Successfully!");
        connection.release(); 
    } catch (err) {
        console.error("❌ TiDB Connection Failed:", err.message);
    }
})();

module.exports = db;