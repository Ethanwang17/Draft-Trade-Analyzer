// Express app and middleware configuration
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const {db, query, execute, getOne, DB_TYPE} = require("./db");

// Express app and middleware configuration
const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup to allow specific frontend domains
const allowedOrigins = [
	"http://localhost:5173", // Local development
	"https://draft-trade-analyzer.vercel.app", // Production Vercel URL
	/\.vercel\.app$/, // Any Vercel preview deployments
	"https://draft-trade-analyzer-frontend.vercel.app", // In case your Vercel domain is different
];

const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl requests)
		if (!origin) return callback(null, true);

		// Check if origin is allowed
		if (
			allowedOrigins.some((allowedOrigin) => {
				if (allowedOrigin instanceof RegExp) {
					return allowedOrigin.test(origin);
				}
				return allowedOrigin === origin;
			})
		) {
			return callback(null, true);
		}

		callback(new Error("Not allowed by CORS"));
	},
	credentials: true,
};

// Helper to convert numbers to ordinal strings (e.g., 1 -> 1st)
function getOrdinalRound(round) {
	const suffixes = ["th", "st", "nd", "rd"];
	const suffix =
		round % 100 <= 10 || round % 100 >= 14
			? suffixes[round % 10 < 4 ? round % 10 : 0]
			: "th";
	return round + suffix;
}

// Express middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Database setup
console.log(`Using PostgreSQL database`);

// Define and initialize PostgreSQL tables for application entities
async function initializeDatabase() {
	console.log("Initializing database tables...");

	// Create Teams table
	await execute(`CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    logo TEXT
  )`);

	// Create Draft Picks table
	await execute(`CREATE TABLE IF NOT EXISTS draft_picks (
    id SERIAL PRIMARY KEY,
    team_id INTEGER,
    year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    pick_number INTEGER,
    valuation INTEGER DEFAULT 1,
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

	// Create Draft Pick Values table
	await execute(`CREATE TABLE IF NOT EXISTS valuation_1 (
    id SERIAL PRIMARY KEY,
    pick_position INTEGER NOT NULL,
    value NUMERIC NOT NULL,
    normalized NUMERIC NOT NULL
  )`);

	// Create Valuations table
	await execute(`CREATE TABLE IF NOT EXISTS valuations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    description TEXT
  )`);

	// Create Saved Trades table
	await execute(`CREATE TABLE IF NOT EXISTS saved_trades (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trade_name TEXT,
    valuation_model_id INTEGER DEFAULT 1
  )`);

	// Create Saved Trade Teams table
	await execute(`CREATE TABLE IF NOT EXISTS saved_trade_teams (
    id SERIAL PRIMARY KEY,
    saved_trade_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_order INTEGER NOT NULL, 
    FOREIGN KEY (saved_trade_id) REFERENCES saved_trades (id),
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

	// Create Saved Trade Picks table
	await execute(`CREATE TABLE IF NOT EXISTS saved_trade_picks (
    id SERIAL PRIMARY KEY,
    saved_trade_id INTEGER NOT NULL,
    draft_pick_id INTEGER NOT NULL,
    sending_team_id INTEGER NOT NULL,
    receiving_team_id INTEGER NOT NULL,
    FOREIGN KEY (saved_trade_id) REFERENCES saved_trades (id),
    FOREIGN KEY (draft_pick_id) REFERENCES draft_picks (id),
    FOREIGN KEY (sending_team_id) REFERENCES teams (id),
    FOREIGN KEY (receiving_team_id) REFERENCES teams (id)
  )`);

	// Check if valuation_model_id column exists in saved_trades
	const columnExists = await query(`
		SELECT column_name FROM information_schema.columns 
		WHERE table_name='saved_trades' AND column_name='valuation_model_id'
	`);

	if (columnExists.length === 0) {
		await execute(
			`ALTER TABLE saved_trades ADD COLUMN valuation_model_id INTEGER DEFAULT 1`
		);
		console.log("Added valuation_model_id column to saved_trades table");
	}

	// Insert default valuation if it doesn't exist
	const defaultValuation = await getOne(
		"SELECT id FROM valuations WHERE id = 1"
	);

	if (!defaultValuation) {
		await execute(
			"INSERT INTO valuations (id, name, table_name, description) VALUES ($1, $2, $3, $4)",
			[
				1,
				"Standard",
				"valuation_1",
				"Default valuation model based on historical draft value",
			]
		);
		console.log("Default valuation model added");
	}
}

// Basic route
app.get("/", (req, res) => {
	res.json({message: "Welcome to the NBA Draft Trade Analyzer API"});
});

// API endpoint: Fetch all teams
app.get("/api/teams", async (req, res) => {
	try {
		const rows = await query("SELECT * FROM teams ORDER BY name");
		res.json(rows);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// API endpoint: Fetch all draft picks
app.get("/api/draft-picks", async (req, res) => {
	try {
		const sql = `
			SELECT dp.*, t.name as team_name, v.name as valuation_name
			FROM draft_picks dp
			JOIN teams t ON dp.team_id = t.id
			LEFT JOIN valuations v ON dp.valuation = v.id
			ORDER BY dp.year, dp.round
		`;

		const rows = await query(sql);
		res.json(rows);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// API endpoint: Get draft picks by team ID
app.get("/api/teams/:teamId/picks", async (req, res) => {
	try {
		const teamId = req.params.teamId;

		const sql = `
			SELECT dp.*, t.name as team_name, v.name as valuation_name
			FROM draft_picks dp
			JOIN teams t ON dp.team_id = t.id
			LEFT JOIN valuations v ON dp.valuation = v.id
			WHERE dp.team_id = $1
			ORDER BY dp.year, dp.round
		`;

		const rows = await query(sql, [teamId]);
		res.json(rows);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// API endpoint: Get pick values for default or specific valuation models
app.get("/api/pick-values", async (req, res) => {
	try {
		const rows = await query(
			"SELECT * FROM valuation_1 ORDER BY pick_position"
		);
		res.json(rows);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Get pick value based on pick number and valuation model
// API endpoint: Get pick values for default or specific valuation models
app.get("/api/pick-value/:pickNumber/:valuation", async (req, res) => {
	try {
		const pickNumber = req.params.pickNumber;
		const valuation = req.params.valuation || 1;

		// First get the table name from the valuations table
		const valuationRow = await getOne(
			"SELECT table_name FROM valuations WHERE id = $1",
			[valuation]
		);

		if (!valuationRow) {
			return res.status(404).json({error: "Valuation model not found"});
		}

		const tableName = valuationRow.table_name;
		const columnName =
			tableName === "valuation_1" ? "pick_position" : "pick_number";

		// Now query the appropriate table with the right column name
		const valueSql = `
			SELECT v.name as valuation_name, pv.value, pv.normalized
			FROM valuations v, ${tableName} pv
			WHERE v.id = $1 AND pv.${columnName} = $2
		`;

		const row = await getOne(valueSql, [valuation, pickNumber]);

		if (!row) {
			return res.status(404).json({error: "Pick value not found"});
		}

		res.json(row);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Get pick value with default valuation model (1)
// API endpoint: Get pick values for default or specific valuation models
app.get("/api/pick-value/:pickNumber", async (req, res) => {
	try {
		const pickNumber = req.params.pickNumber;
		const valuation = 1; // Default valuation

		// First get the table name from the valuations table
		const valuationRow = await getOne(
			"SELECT table_name FROM valuations WHERE id = $1",
			[valuation]
		);

		if (!valuationRow) {
			return res.status(404).json({error: "Valuation model not found"});
		}

		const tableName = valuationRow.table_name;
		const columnName =
			tableName === "valuation_1" ? "pick_position" : "pick_number";

		// Now query the appropriate table with the right column name
		const valueSql = `
			SELECT v.name as valuation_name, pv.value, pv.normalized
			FROM valuations v, ${tableName} pv
			WHERE v.id = $1 AND pv.${columnName} = $2
		`;

		const row = await getOne(valueSql, [valuation, pickNumber]);

		if (!row) {
			return res.status(404).json({error: "Pick value not found"});
		}

		res.json(row);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// API endpoint: Estimate future pick value with depreciation
app.get("/api/future-pick-value/:year/:round/:valuation", async (req, res) => {
	try {
		const year = parseInt(req.params.year);
		const round = parseInt(req.params.round);
		const valuation = parseInt(req.params.valuation) || 1;
		const currentYear = new Date().getFullYear();

		// Validate inputs
		if (isNaN(year) || isNaN(round) || round < 1 || round > 7) {
			return res
				.status(400)
				.json({error: "Invalid year or round parameters"});
		}

		// Get the valuation table name
		const valuationRow = await getOne(
			"SELECT table_name FROM valuations WHERE id = $1",
			[valuation]
		);

		if (!valuationRow) {
			return res.status(404).json({error: "Valuation model not found"});
		}

		const tableName = valuationRow.table_name;
		const columnName =
			tableName === "valuation_1" ? "pick_position" : "pick_number";

		// Calculate average value for the specified round
		const roundRangeSql = `
			SELECT AVG(value) as avg_value, AVG(normalized) as avg_normalized
			FROM ${tableName}
			WHERE ${columnName} BETWEEN $1 AND $2
		`;

		// Calculate range for each round (1-32 for 1st round, 33-64 for 2nd round, etc.)
		const startPosition = (round - 1) * 32 + 1;
		const endPosition = round * 32;

		const row = await getOne(roundRangeSql, [startPosition, endPosition]);

		if (!row || !row.avg_value) {
			return res
				.status(404)
				.json({error: "Could not calculate average value for round"});
		}

		// Calculate depreciation based on years in the future
		const yearsInFuture = year - currentYear;
		const depreciationFactor = Math.pow(0.9, yearsInFuture); // 10% depreciation per year

		// Apply depreciation to the average value
		const futureValue = row.avg_value * depreciationFactor;
		const futureNormalized = row.avg_normalized * depreciationFactor;

		res.json({
			valuation_name: "Future Pick Estimate",
			value: Math.round(futureValue),
			normalized: parseFloat(futureNormalized.toFixed(2)),
			year: year,
			round: round,
			depreciation: (1 - depreciationFactor) * 100,
		});
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// API endpoint: Get all valuation models
app.get("/api/valuations", async (req, res) => {
	try {
		const rows = await query("SELECT * FROM valuations ORDER BY id");
		res.json(rows);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// API endpoint: Create new valuation model with dynamic table
app.post("/api/valuation-models", async (req, res) => {
	try {
		const {name, description, values, normalized} = req.body;

		// Basic validation
		if (!name || typeof name !== "string" || name.trim() === "") {
			return res.status(400).json({error: "Model name is required"});
		}

		if (!Array.isArray(values) || values.length === 0) {
			return res.status(400).json({error: "Values array is required"});
		}

		// Ensure all values are numbers and positive
		const numericValues = values.map((v) => Number(v));
		if (numericValues.some((v) => isNaN(v) || v <= 0)) {
			return res
				.status(400)
				.json({error: "All pick values must be positive numbers"});
		}

		const firstValue = numericValues[0];
		if (firstValue <= 0) {
			return res
				.status(400)
				.json({error: "First pick value must be greater than zero"});
		}

		// Check for unique model name
		const existing = await getOne(
			"SELECT id FROM valuations WHERE LOWER(name) = LOWER($1)",
			[name.trim()]
		);

		if (existing) {
			return res.status(400).json({error: "Model name must be unique"});
		}

		// Insert placeholder to get new ID
		const result = await execute(
			"INSERT INTO valuations (name, table_name, description) VALUES ($1, $2, $3) RETURNING id",
			[name.trim(), "temp", description || null]
		);

		const newId = result.rows[0].id;
		const tableName = `valuation_${newId}`;

		// Update record with real table name
		await execute("UPDATE valuations SET table_name = $1 WHERE id = $2", [
			tableName,
			newId,
		]);

		// Create dynamic table
		await execute(`CREATE TABLE IF NOT EXISTS ${tableName} (
			id SERIAL PRIMARY KEY,
			pick_number INTEGER NOT NULL,
			value NUMERIC NOT NULL,
			normalized NUMERIC NOT NULL
		)`);

		// Insert values
		for (let i = 0; i < numericValues.length; i++) {
			const pickNumber = i + 1;
			const value = numericValues[i];
			let normalizedValue;

			if (
				normalized &&
				Array.isArray(normalized) &&
				normalized.length > i
			) {
				normalizedValue = normalized[i];
			} else {
				normalizedValue = (value / firstValue) * 100;
			}

			await execute(
				`INSERT INTO ${tableName} (pick_number, value, normalized) VALUES ($1, $2, $3)`,
				[pickNumber, value, normalizedValue]
			);
		}

		res.status(201).json({
			id: newId,
			name: name.trim(),
			table_name: tableName,
			description: description || null,
		});
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Start server after DB init and gracefully shut down on SIGINT
initializeDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("Failed to initialize database:", err);
		process.exit(1);
	});

process.on("SIGINT", async () => {
	try {
		await close();
		console.log("Database connection closed");
		process.exit(0);
	} catch (err) {
		console.error("Error closing database connection:", err.message);
		process.exit(1);
	}
});

// API endpoint: Get, load, save, and delete saved trades

// Get all saved trades
app.get("/api/saved-trades", async (req, res) => {
	try {
		// First get all trades
		const tradeSql = `
			SELECT id, created_at, trade_name
			FROM saved_trades
			ORDER BY created_at DESC
		`;

		const trades = await query(tradeSql);

		if (trades.length === 0) {
			return res.json([]);
		}

		// Prepare an array to collect all complete trade data
		const completeTradesData = [];

		// For each trade, get the teams involved
		for (const trade of trades) {
			const teamsSql = `
				SELECT st.*, t.id as team_id, t.name, t.abbreviation, t.logo
				FROM saved_trade_teams st
				JOIN teams t ON st.team_id = t.id
				WHERE st.saved_trade_id = $1
				ORDER BY st.team_order
			`;

			const teams = await query(teamsSql, [trade.id]);

			// Format the trade data with team information
			const tradeData = {
				id: trade.id,
				created_at: trade.created_at,
				trade_name: trade.trade_name,
				teams: teams.map((team) => ({
					id: team.team_id,
					name: team.name,
					abbreviation: team.abbreviation,
					logo: team.logo,
					order: team.team_order,
				})),
			};

			completeTradesData.push(tradeData);
		}

		res.json(completeTradesData);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Get a specific saved trade with its picks
app.get("/api/saved-trades/:id", async (req, res) => {
	try {
		const tradeId = req.params.id;

		// Get the trade details
		const tradeSql = `
			SELECT id, created_at, trade_name
			FROM saved_trades
			WHERE id = $1
		`;

		const trade = await getOne(tradeSql, [tradeId]);

		if (!trade) {
			return res.status(404).json({error: "Trade not found"});
		}

		// Get the teams involved in the trade
		const teamsSql = `
			SELECT stt.team_order, t.id, t.name, t.abbreviation, t.logo
			FROM saved_trade_teams stt
			JOIN teams t ON stt.team_id = t.id
			WHERE stt.saved_trade_id = $1
			ORDER BY stt.team_order
		`;

		const teams = await query(teamsSql, [tradeId]);

		if (teams.length === 0) {
			return res
				.status(404)
				.json({error: "No teams found for this trade"});
		}

		// Get the picks involved in the trade
		const picksSql = `
			SELECT 
				stp.*, 
				dp.year, dp.round, dp.pick_number, 
				t_sending.id as sending_team_id, t_sending.name as sending_team_name, t_sending.logo as sending_team_logo,
				t_receiving.id as receiving_team_id, t_receiving.name as receiving_team_name, t_receiving.logo as receiving_team_logo
			FROM saved_trade_picks stp
			JOIN draft_picks dp ON stp.draft_pick_id = dp.id
			JOIN teams t_sending ON stp.sending_team_id = t_sending.id
			JOIN teams t_receiving ON stp.receiving_team_id = t_receiving.id
			WHERE stp.saved_trade_id = $1
		`;

		const picks = await query(picksSql, [tradeId]);

		// Organize picks by team
		const picksByTeam = {};

		// Initialize picksByTeam for each team
		teams.forEach((team) => {
			picksByTeam[team.id] = {
				sending: [],
				receiving: [],
			};
		});

		// Populate picks for each team
		picks.forEach((pick) => {
			// Add to sending team's outgoing picks
			if (picksByTeam[pick.sending_team_id]) {
				picksByTeam[pick.sending_team_id].sending.push(pick);
			}

			// Add to receiving team's incoming picks
			if (picksByTeam[pick.receiving_team_id]) {
				picksByTeam[pick.receiving_team_id].receiving.push(pick);
			}
		});

		res.json({
			...trade,
			teams,
			picksByTeam,
		});
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Get a specific saved trade with data formatted for loading into trade builder
app.get("/api/trades/:id/full", async (req, res) => {
	try {
		const tradeId = req.params.id;

		// Get the trade details
		const tradeSql = `
			SELECT id, created_at, trade_name, valuation_model_id
			FROM saved_trades
			WHERE id = $1
		`;

		const trade = await getOne(tradeSql, [tradeId]);

		if (!trade) {
			return res.status(404).json({error: "Trade not found"});
		}

		// Get the teams involved in the trade
		const teamsSql = `
			SELECT stt.team_order, t.id, t.name, t.abbreviation, t.logo
			FROM saved_trade_teams stt
			JOIN teams t ON stt.team_id = t.id
			WHERE stt.saved_trade_id = $1
			ORDER BY stt.team_order
		`;

		const teams = await query(teamsSql, [tradeId]);

		if (teams.length === 0) {
			return res
				.status(404)
				.json({error: "No teams found for this trade"});
		}

		// Get all picks for all teams in this trade
		const teamIds = teams.map((team) => team.id);
		const placeholders = teamIds.map((_, i) => `$${i + 1}`).join(",");

		const allPicksSql = `
			SELECT 
				dp.team_id as team_id, 
				dp.id as pick_id,
				dp.year, 
				dp.round, 
				dp.pick_number,
				t.id as original_team_id,
				t.name as original_team_name,
				t.logo as original_team_logo
			FROM draft_picks dp
			JOIN teams t ON dp.team_id = t.id
			WHERE dp.team_id IN (${placeholders})
		`;

		const allPicks = await query(allPicksSql, teamIds);

		// Get the picks involved in the trade
		const tradedPicksSql = `
			SELECT 
				stp.draft_pick_id,
				stp.sending_team_id,
				stp.receiving_team_id
			FROM saved_trade_picks stp
			WHERE stp.saved_trade_id = $1
		`;

		const tradedPicks = await query(tradedPicksSql, [tradeId]);

		// Create team groups for the trade builder
		const teamGroups = teams.map((team, index) => {
			// Format team data for trade builder
			const teamGroup = {
				id: index + 1,
				name: team.name,
				logo: team.logo,
				teamId: team.id,
				picks: [], // will be populated with picks
			};

			// Get this team's picks
			const teamPicksMap = {};

			allPicks.forEach((pick) => {
				if (pick.team_id === team.id) {
					// Create a unique pick ID
					const pickId = `pick-${pick.pick_id}`;
					teamPicksMap[pick.pick_id] = {
						id: pickId,
						content: `${pick.year} ${getOrdinalRound(
							pick.round
						)} Pick${
							pick.pick_number ? ` (#${pick.pick_number})` : ""
						}`,
						pickId: pick.pick_id,
						year: pick.year,
						round: pick.round,
						pick_number: pick.pick_number,
						originalTeamLogo: pick.original_team_logo || team.logo,
						originalTeamId: pick.original_team_id,
						originalTeamName: pick.original_team_name,
						valuation: trade.valuation_model_id || 1,
					};
				}
			});

			// Initialize picks array with this team's original picks
			const teamPicks = Object.values(teamPicksMap);

			// Apply traded picks
			tradedPicks.forEach((tradedPick) => {
				// If this pick was sent by this team
				if (tradedPick.sending_team_id === team.id) {
					// Remove the pick if it was sent away
					const pickIndex = teamPicks.findIndex(
						(p) => parseInt(p.pickId) === tradedPick.draft_pick_id
					);
					if (pickIndex !== -1) {
						teamPicks.splice(pickIndex, 1);
					}
				}

				// If this pick was received by this team
				if (tradedPick.receiving_team_id === team.id) {
					// Find the pick in all picks
					const receivedPick = allPicks.find(
						(p) => p.pick_id === tradedPick.draft_pick_id
					);
					if (receivedPick) {
						// Find original team
						const originalTeam = teams.find(
							(t) => t.id === tradedPick.sending_team_id
						);
						if (originalTeam) {
							// Add the received pick to this team's picks
							teamPicks.push({
								id: `pick-${receivedPick.pick_id}`,
								content: `${
									receivedPick.year
								} ${getOrdinalRound(receivedPick.round)} Pick${
									receivedPick.pick_number
										? ` (#${receivedPick.pick_number})`
										: ""
								}`,
								pickId: receivedPick.pick_id,
								year: receivedPick.year,
								round: receivedPick.round,
								pick_number: receivedPick.pick_number,
								originalTeamLogo: originalTeam.logo,
								originalTeamId: tradedPick.sending_team_id,
								originalTeamName: originalTeam.name,
								valuation: trade.valuation_model_id || 1,
								className: "traded-pick", // Add traded class
							});
						}
					}
				}
			});

			// Assign picks to the team group
			teamGroup.picks = teamPicks;

			return teamGroup;
		});

		res.json({
			id: trade.id,
			trade_name: trade.trade_name,
			valuation_model_id: trade.valuation_model_id || 1,
			teamGroups: teamGroups,
		});
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Save a new trade
app.post("/api/saved-trades", async (req, res) => {
	try {
		const {teams, trade_name, picks, valuation_model_id} = req.body;

		if (
			!teams ||
			!Array.isArray(teams) ||
			teams.length < 2 ||
			!picks ||
			!Array.isArray(picks)
		) {
			return res.status(400).json({error: "Missing required parameters"});
		}

		// Begin transaction
		await execute("BEGIN");

		try {
			// Insert the trade
			const tradeResult = await execute(
				"INSERT INTO saved_trades (trade_name, valuation_model_id) VALUES ($1, $2) RETURNING id",
				[trade_name || null, valuation_model_id || 1]
			);

			// Get the new trade ID
			const savedTradeId = tradeResult.rows[0].id;

			// Insert teams
			for (let index = 0; index < teams.length; index++) {
				const team = teams[index];
				await execute(
					"INSERT INTO saved_trade_teams (saved_trade_id, team_id, team_order) VALUES ($1, $2, $3)",
					[savedTradeId, team.id, index]
				);
			}

			// Insert picks
			for (const pick of picks) {
				await execute(
					"INSERT INTO saved_trade_picks (saved_trade_id, draft_pick_id, sending_team_id, receiving_team_id) VALUES ($1, $2, $3, $4)",
					[
						savedTradeId,
						pick.draft_pick_id,
						pick.sending_team_id,
						pick.receiving_team_id,
					]
				);
			}

			// Commit transaction
			await execute("COMMIT");

			res.status(201).json({
				id: savedTradeId,
				message: "Trade saved successfully",
			});
		} catch (err) {
			// Rollback on error
			await execute("ROLLBACK");
			throw err;
		}
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

// Delete a saved trade
app.delete("/api/saved-trades/:id", async (req, res) => {
	try {
		const tradeId = req.params.id;

		// Begin transaction
		await execute("BEGIN");

		try {
			// Delete picks first
			await execute(
				"DELETE FROM saved_trade_picks WHERE saved_trade_id = $1",
				[tradeId]
			);

			// Delete team associations
			await execute(
				"DELETE FROM saved_trade_teams WHERE saved_trade_id = $1",
				[tradeId]
			);

			// Delete the trade
			const result = await execute(
				"DELETE FROM saved_trades WHERE id = $1",
				[tradeId]
			);

			// Check if the trade was found and deleted
			const changes = result.rowCount;

			if (changes === 0) {
				// Rollback if no trade was found
				await execute("ROLLBACK");
				return res.status(404).json({error: "Trade not found"});
			}

			// Commit transaction
			await execute("COMMIT");

			res.json({message: "Trade deleted successfully"});
		} catch (err) {
			// Rollback on error
			await execute("ROLLBACK");
			throw err;
		}
	} catch (err) {
		res.status(500).json({error: err.message});
	}
});

module.exports = app;
