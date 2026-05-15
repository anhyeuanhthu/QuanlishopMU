const sql = require("mssql");

const config = {
    user: "ivandeptrai",
    password: "lekhang1710",
    server: "IVANKUN/SQLEXPRESS",
    database: "ShopDB",
    options: {
        trustServerCertificate: true
    }
};

async function connectDB() {
    try {
        await sql.connect(config);
        console.log("✅ Connected to SQL Server");
    } catch (err) {
        console.log("❌ DB Error:", err);
    }
}

module.exports = { sql, connectDB };