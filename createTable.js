// createTable.js
require("dotenv").config();
const db = require("./src/connection/db");

const sql = `
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(100),
  size BIGINT,
  url TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(sql, (err) => {
  if (err) {
    console.error("❌ Error creating table:", err.message);
  } else {
    console.log("✅ Table 'documents' created successfully in AWS RDS!");
  }
  process.exit();
});
