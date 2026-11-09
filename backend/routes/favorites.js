const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// 1. Get all favorites for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT pokemon_id, pokemon_name, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching favorites:", err.message);
    res.status(500).json({ error: "Server error fetching favorites" });
  }
});

// 2. Add a Pokémon to favorites
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pokemon_id, pokemon_name } = req.body;

    if (!pokemon_id || !pokemon_name) {
      return res.status(400).json({ error: "Both pokemon_id and pokemon_name are required." });
    }

    const result = await pool.query(
      `INSERT INTO favorites (user_id, pokemon_id, pokemon_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, pokemon_id) DO UPDATE SET pokemon_name = EXCLUDED.pokemon_name
       RETURNING *`,
      [userId, pokemon_id, pokemon_name.toLowerCase()]
    );

    res.status(201).json({
      message: "Added to favorites!",
      favorite: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding favorite:", err.message);
    res.status(500).json({ error: "Server error adding favorite" });
  }
});

// 3. Remove a Pokémon from favorites
router.delete("/:pokemon_id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pokemonId = Number(req.params.pokemon_id);

    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND pokemon_id = $2",
      [userId, pokemonId]
    );

    res.json({ message: "Removed from favorites!" });
  } catch (err) {
    console.error("Error removing favorite:", err.message);
    res.status(500).json({ error: "Server error removing favorite" });
  }
});

module.exports = router;