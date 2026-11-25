
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON requests
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Initialize database table
async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Notes table is ready");
}

// Health endpoint
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            status: "healthy",
            database: "connected"
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        res.status(503).json({
            status: "unhealthy",
            database: "disconnected"
        });
    }
});

// Retrieve all notes
app.get("/api/notes", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM notes ORDER BY id DESC"
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Fetch notes error:", error.message);

        res.status(500).json({
            error: "Failed to fetch notes"
        });
    }
});

// Create a new note
app.post("/api/notes", async (req, res) => {
    try {
        const { content } = req.body;

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                error: "Note content is required"
            });
        }

        const result = await pool.query(
            "INSERT INTO notes (content) VALUES ($1) RETURNING *",
            [content.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create note error:", error.message);

        res.status(500).json({
            error: "Failed to create note"
        });
    }
});

// Start backend after database initialization
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Backend listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database initialization failed:", error.message);
        process.exit(1);
    }
}

startServer();

