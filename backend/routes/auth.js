const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// 1. REGISTER ROUTE (Sign Up)
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user into database
    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at",
      [username, passwordHash]
    );

    res.status(201).json({
      message: "User registered successfully!",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// 2. LOGIN ROUTE (Sign In)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user in database
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Compare submitted password with stored hash
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Create a JWT token valid for 1 hour
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Logged in successfully!",
      token,
      user: { id: user.rows[0].id, username: user.rows[0].username },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;