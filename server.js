import express from "express";
import cors from "cors";
import pool from "./db.js";
import identifyRoute from "./routes/identify.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/identify", identifyRoute);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test DB connection
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL");

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Contact (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        phoneNumber VARCHAR(255),
        linkedId INTEGER REFERENCES Contact(id),
        linkPrecedence VARCHAR(20) CHECK (linkPrecedence IN ('primary', 'secondary')) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP
      );
    `);

    console.log("Contact table ready");

    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });

  } catch (err) {
    console.error("Startup error:", err);
  }
}

startServer();