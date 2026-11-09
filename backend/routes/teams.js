const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// 1. Get all teams and their associated Pokémon for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user's teams
    const teamsResult = await pool.query(
      "SELECT * FROM teams WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    // For each team, fetch its Pokémon from the team_pokemon junction table
    const teamsWithPokemon = await Promise.all(
      teamsResult.rows.map(async (team) => {
        const pokeResult = await pool.query(
          "SELECT pokemon_id, slot_number FROM team_pokemon WHERE team_id = $1 ORDER BY slot_number ASC",
          [team.id]
        );
        return {
          ...team,
          team_name: team.name, // Ensure compatibility with frontend team_name alias if needed
          pokemon_ids: pokeResult.rows.map((p) => p.pokemon_id),
          members: pokeResult.rows.map((p) => ({
            pokemon_id: p.pokemon_id,
            slot_number: p.slot_number,
          })),
        };
      })
    );

    res.json(teamsWithPokemon);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching teams" });
  }
});

// 2. Save a new team
router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { name, pokemon_ids = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Team name is required!" });
    }

    if (pokemon_ids.length > 6) {
      return res.status(400).json({ error: "A Pokémon team can have a maximum of 6 members!" });
    }

    await client.query("BEGIN");

    const teamResult = await client.query(
      "INSERT INTO teams (user_id, name) VALUES ($1, $2) RETURNING *",
      [userId, name]
    );
    const newTeam = teamResult.rows[0];

    for (let i = 0; i < pokemon_ids.length; i++) {
      await client.query(
        "INSERT INTO team_pokemon (team_id, pokemon_id, slot_number) VALUES ($1, $2, $3)",
        [newTeam.id, pokemon_ids[i], i + 1]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Team saved successfully!",
      team: {
        ...newTeam,
        team_name: newTeam.name,
        pokemon_ids,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error saving team" });
  } finally {
    client.release();
  }
});

// 3. Add a Pokémon member to an existing team
router.post("/:id/members", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const teamId = req.params.id;
    const pokemon_id = Number(req.body.pokemon_id);

    if (!pokemon_id || isNaN(pokemon_id)) {
      return res.status(400).json({ error: "A valid Pokémon ID is required!" });
    }

    // Verify team belongs to user
    const teamCheck = await client.query("SELECT * FROM teams WHERE id = $1 AND user_id = $2", [teamId, userId]);
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({ error: "Team not found or unauthorized" });
    }

    // Check current members
    const membersRes = await client.query("SELECT * FROM team_pokemon WHERE team_id = $1 ORDER BY slot_number ASC", [teamId]);
    if (membersRes.rows.length >= 6) {
      return res.status(400).json({ error: "A Pokémon team can have a maximum of 6 members!" });
    }

    // Check duplicate
    const exists = membersRes.rows.some((m) => Number(m.pokemon_id) === pokemon_id);
    if (exists) {
      return res.status(400).json({ error: "This Pokémon is already on your team!" });
    }

    const nextSlot = membersRes.rows.length + 1;

    await client.query(
      "INSERT INTO team_pokemon (team_id, pokemon_id, slot_number) VALUES ($1, $2, $3)",
      [teamId, pokemon_id, nextSlot]
    );

    res.status(201).json({ message: "Pokémon added to team successfully!" });
  } catch (err) {
    console.error("Error adding member:", err.message);
    if (err.code === "23505") {
      return res.status(400).json({ error: "This Pokémon is already on your team!" });
    }
    res.status(500).json({ error: `Server error adding member: ${err.message}` });
  } finally {
    client.release();
  }
});

// 4. Remove a Pokémon member from a team
router.delete("/:id/members/:pokemon_id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = req.params.id;
    const pokemonId = req.params.pokemon_id;

    // Verify team belongs to user
    const teamCheck = await pool.query("SELECT * FROM teams WHERE id = $1 AND user_id = $2", [teamId, userId]);
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({ error: "Team not found or unauthorized" });
    }

    await pool.query(
      "DELETE FROM team_pokemon WHERE team_id = $1 AND pokemon_id = $2",
      [teamId, pokemonId]
    );

    res.json({ message: "Pokémon removed from team successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error removing member" });
  }
});

// 5. Delete an entire team
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query("DELETE FROM teams WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ message: "Team deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error deleting team" });
  }
});

module.exports = router;