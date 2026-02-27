import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import identifyRoute from "./routes/identify.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/identify", identifyRoute);

//  Test DB connection when server starts
pool.connect()
  .then(() => {
    console.log(" Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error(" Database connection error:", err);
  });

app.listen(3000, () => {
  console.log(" Server running on port 3000");
});