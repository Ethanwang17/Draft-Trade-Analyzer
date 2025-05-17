const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Database setup
const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error("Error opening database", err.message);
	} else {
		console.log("Connected to the SQLite database");
		initializeDatabase();
	}
});

// Initialize database tables
function initializeDatabase() {
	// Create Teams table
	db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    logo TEXT
  )`);

	// Create Draft Picks table
	db.run(`CREATE TABLE IF NOT EXISTS draft_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    original_team_id INTEGER,
    protected TEXT,
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (original_team_id) REFERENCES teams (id)
  )`);

	// Create Draft Pick Values table
	db.run(`CREATE TABLE IF NOT EXISTS pick_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pick_position INTEGER NOT NULL,
    value REAL NOT NULL,
    normalized REAL NOT NULL
  )`);
}

// Basic route
app.get("/", (req, res) => {
	res.json({message: "Welcome to the NBA Draft Trade Analyzer API"});
});

// Teams API Routes
app.get("/api/teams", (req, res) => {
	db.all("SELECT * FROM teams ORDER BY name", [], (err, rows) => {
		if (err) {
			res.status(500).json({error: err.message});
			return;
		}
		res.json(rows);
	});
});

// Draft Picks API Routes
app.get("/api/draft-picks", (req, res) => {
	const sql = `
    SELECT dp.*, t1.name as team_name, t2.name as original_team_name 
    FROM draft_picks dp
    JOIN teams t1 ON dp.team_id = t1.id
    LEFT JOIN teams t2 ON dp.original_team_id = t2.id
    ORDER BY dp.year, dp.round
  `;

	db.all(sql, [], (err, rows) => {
		if (err) {
			res.status(500).json({error: err.message});
			return;
		}
		res.json(rows);
	});
});

// Pick Values API Routes
app.get("/api/pick-values", (req, res) => {
	db.all(
		"SELECT * FROM pick_values ORDER BY pick_position",
		[],
		(err, rows) => {
			if (err) {
				res.status(500).json({error: err.message});
				return;
			}
			res.json(rows);
		}
	);
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// Handle application shutdown
process.on("SIGINT", () => {
	db.close((err) => {
		if (err) {
			console.error(err.message);
		}
		console.log("Database connection closed");
		process.exit(0);
	});
});
