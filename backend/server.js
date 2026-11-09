const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./database.env" });
const pool = require("./db");
const authRoutes = require("./routes/auth"); // Import auth routes
const favoritesRoutes = require("./routes/favorites");
const teamsRoutes = require("./routes/teams");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes); // All auth requests will start with /api/auth
app.use("/api/favorites", favoritesRoutes); // All favorites requests will start with /api/favorites
app.use("/api/teams", teamsRoutes); 

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Pokédex API!" });
});

// Test Database Connection Route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});