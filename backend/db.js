const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for secure cloud PostgreSQL connections like Supabase
  },
});

pool.on("connect", () => {
  console.log("Connected to the Supabase PostgreSQL database!");
});

module.exports = pool;