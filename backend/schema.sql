-- Drop existing tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS team_pokemon CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Favorites table (links a user to their favorite Pokémon)
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    pokemon_id INT NOT NULL,
    pokemon_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pokemon_id)
);

-- 3. Teams table (stores user-created custom teams)
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Team-Pokemon junction table (many-to-many relationship for team slots 1-6)
CREATE TABLE team_pokemon (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    pokemon_id INT NOT NULL,
    slot_number INT CHECK (slot_number BETWEEN 1 AND 6),
    UNIQUE(team_id, slot_number)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_pokemon_team_id ON team_pokemon(team_id);