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
const db = new sqlite3.Database(
	dbPath,
	sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
	(err) => {
		if (err) {
			console.error("Error opening database", err.message);
		} else {
			console.log("Connected to the SQLite database in read-write mode");
			initializeDatabase();
		}
	}
);

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
    pick_number INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

	// Create Draft Pick Values table
	db.run(`CREATE TABLE IF NOT EXISTS pick_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pick_position INTEGER NOT NULL,
    value REAL NOT NULL,
    normalized REAL NOT NULL
  )`);

	// Create Valuations table
	db.run(`CREATE TABLE IF NOT EXISTS valuations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    description TEXT
  )`);

	// Create Saved Trades table
	db.run(`CREATE TABLE IF NOT EXISTS saved_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trade_name TEXT
  )`);

	// Create Saved Trade Teams table
	db.run(`CREATE TABLE IF NOT EXISTS saved_trade_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saved_trade_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_order INTEGER NOT NULL, 
    FOREIGN KEY (saved_trade_id) REFERENCES saved_trades (id),
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

	// Create Saved Trade Picks table
	db.run(`CREATE TABLE IF NOT EXISTS saved_trade_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saved_trade_id INTEGER NOT NULL,
    draft_pick_id INTEGER NOT NULL,
    sending_team_id INTEGER NOT NULL,
    receiving_team_id INTEGER NOT NULL,
    FOREIGN KEY (saved_trade_id) REFERENCES saved_trades (id),
    FOREIGN KEY (draft_pick_id) REFERENCES draft_picks (id),
    FOREIGN KEY (sending_team_id) REFERENCES teams (id),
    FOREIGN KEY (receiving_team_id) REFERENCES teams (id)
  )`);

	// Add valuation_model_id column to saved_trades table if it doesn't exist
	db.all("PRAGMA table_info(saved_trades)", [], (err, rows) => {
		if (err) {
			console.error("Error checking saved_trades schema:", err.message);
			return;
		}

		// Check if column exists
		const hasValuationModelColumn =
			rows && rows.some((row) => row.name === "valuation_model_id");

		if (!hasValuationModelColumn) {
			db.run(
				`ALTER TABLE saved_trades ADD COLUMN valuation_model_id INTEGER DEFAULT 1 REFERENCES valuations(id)`,
				(err) => {
					if (err) {
						console.error(
							"Error adding valuation_model_id column:",
							err.message
						);
					} else {
						console.log(
							"Added valuation_model_id column to saved_trades table"
						);
					}
				}
			);
		}
	});

	// Insert default valuation if it doesn't exist
	db.get("SELECT id FROM valuations WHERE id = 1", [], (err, row) => {
		if (err) {
			console.error("Error checking for default valuation:", err.message);
			return;
		}

		if (!row) {
			db.run(
				"INSERT INTO valuations (id, name, table_name, description) VALUES (?, ?, ?, ?)",
				[
					1,
					"Standard",
					"pick_values",
					"Default valuation model based on historical draft value",
				],
				(err) => {
					if (err) {
						console.error(
							"Error inserting default valuation:",
							err.message
						);
					} else {
						console.log("Default valuation model added");
					}
				}
			);
		}
	});
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
    SELECT dp.*, t.name as team_name, v.name as valuation_name
    FROM draft_picks dp
    JOIN teams t ON dp.team_id = t.id
    LEFT JOIN valuations v ON dp.valuation = v.id
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

// Get picks by team ID
app.get("/api/teams/:teamId/picks", (req, res) => {
	const teamId = req.params.teamId;

	const sql = `
    SELECT dp.*, t.name as team_name, v.name as valuation_name
    FROM draft_picks dp
    JOIN teams t ON dp.team_id = t.id
    LEFT JOIN valuations v ON dp.valuation = v.id
    WHERE dp.team_id = ?
    ORDER BY dp.year, dp.round
  `;

	db.all(sql, [teamId], (err, rows) => {
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

// Get pick value based on pick number and valuation model
app.get("/api/pick-value/:pickNumber/:valuation", (req, res) => {
	const pickNumber = req.params.pickNumber;
	const valuation = req.params.valuation || 1;

	// First get the table name from the valuations table
	db.get(
		"SELECT table_name FROM valuations WHERE id = ?",
		[valuation],
		(err, valuationRow) => {
			if (err) {
				res.status(500).json({error: err.message});
				return;
			}

			if (!valuationRow) {
				res.status(404).json({error: "Valuation model not found"});
				return;
			}

			const tableName = valuationRow.table_name;
			const columnName =
				tableName === "pick_values" ? "pick_position" : "pick_number";

			// Now query the appropriate table with the right column name
			const valueSql = `
				SELECT v.name as valuation_name, pv.value, pv.normalized
				FROM valuations v, ${tableName} pv
				WHERE v.id = ? AND pv.${columnName} = ?
			`;

			db.get(valueSql, [valuation, pickNumber], (err, row) => {
				if (err) {
					res.status(500).json({error: err.message});
					return;
				}

				if (!row) {
					res.status(404).json({error: "Pick value not found"});
					return;
				}

				res.json(row);
			});
		}
	);
});

// Get pick value with default valuation model (1)
app.get("/api/pick-value/:pickNumber", (req, res) => {
	const pickNumber = req.params.pickNumber;
	const valuation = 1; // Default valuation

	// First get the table name from the valuations table
	db.get(
		"SELECT table_name FROM valuations WHERE id = ?",
		[valuation],
		(err, valuationRow) => {
			if (err) {
				res.status(500).json({error: err.message});
				return;
			}

			if (!valuationRow) {
				res.status(404).json({error: "Valuation model not found"});
				return;
			}

			const tableName = valuationRow.table_name;
			const columnName =
				tableName === "pick_values" ? "pick_position" : "pick_number";

			// Now query the appropriate table with the right column name
			const valueSql = `
				SELECT v.name as valuation_name, pv.value, pv.normalized
				FROM valuations v, ${tableName} pv
				WHERE v.id = ? AND pv.${columnName} = ?
			`;

			db.get(valueSql, [valuation, pickNumber], (err, row) => {
				if (err) {
					res.status(500).json({error: err.message});
					return;
				}

				if (!row) {
					res.status(404).json({error: "Pick value not found"});
					return;
				}

				res.json(row);
			});
		}
	);
});

// Get round average pick value for future picks
app.get("/api/future-pick-value/:year/:round/:valuation", (req, res) => {
	const year = parseInt(req.params.year);
	const round = parseInt(req.params.round);
	const valuation = parseInt(req.params.valuation) || 1;
	const currentYear = new Date().getFullYear();

	// Validate inputs
	if (isNaN(year) || isNaN(round) || round < 1 || round > 7) {
		res.status(400).json({error: "Invalid year or round parameters"});
		return;
	}

	// Get the valuation table name
	db.get(
		"SELECT table_name FROM valuations WHERE id = ?",
		[valuation],
		(err, valuationRow) => {
			if (err) {
				res.status(500).json({error: err.message});
				return;
			}

			if (!valuationRow) {
				res.status(404).json({error: "Valuation model not found"});
				return;
			}

			const tableName = valuationRow.table_name;
			const columnName =
				tableName === "pick_values" ? "pick_position" : "pick_number";

			// Calculate average value for the specified round
			const roundRangeSql = `
				SELECT AVG(value) as avg_value, AVG(normalized) as avg_normalized
				FROM ${tableName}
				WHERE ${columnName} BETWEEN ? AND ?
			`;

			// Calculate range for each round (1-32 for 1st round, 33-64 for 2nd round, etc.)
			const startPosition = (round - 1) * 32 + 1;
			const endPosition = round * 32;

			db.get(roundRangeSql, [startPosition, endPosition], (err, row) => {
				if (err) {
					res.status(500).json({error: err.message});
					return;
				}

				if (!row || !row.avg_value) {
					res.status(404).json({
						error: "Could not calculate average value for round",
					});
					return;
				}

				// Calculate depreciation based on years in the future
				const yearsInFuture = year - currentYear;
				const depreciationFactor = Math.pow(0.9, yearsInFuture); // 10% depreciation per year

				// Apply depreciation to the average value
				const futureValue = row.avg_value * depreciationFactor;
				const futureNormalized =
					row.avg_normalized * depreciationFactor;

				res.json({
					valuation_name: "Future Pick Estimate",
					value: Math.round(futureValue),
					normalized: parseFloat(futureNormalized.toFixed(2)),
					year: year,
					round: round,
					depreciation: (1 - depreciationFactor) * 100,
				});
			});
		}
	);
});

// Get all valuation models
app.get("/api/valuations", (req, res) => {
	db.all("SELECT * FROM valuations ORDER BY id", [], (err, rows) => {
		if (err) {
			res.status(500).json({error: err.message});
			return;
		}
		res.json(rows);
	});
});

// Create a new valuation model
app.post("/api/valuation-models", (req, res) => {
	const {name, description, values} = req.body;

	// Validate required fields
	if (!name || !values || !Array.isArray(values) || values.length === 0) {
		res.status(400).json({
			error: "Missing required fields or invalid values array",
		});
		return;
	}

	// Check that all values have required fields
	const validValues = values.every(
		(val) =>
			val &&
			val.pick_position !== undefined &&
			val.value !== undefined &&
			val.normalized !== undefined
	);

	if (!validValues) {
		res.status(400).json({
			error: "All values must have pick_position, value, and normalized fields",
		});
		return;
	}

	// Start a transaction to ensure all operations complete or none do
	db.serialize(() => {
		db.run("BEGIN TRANSACTION");

		// Check if the model name already exists
		db.get(
			"SELECT id FROM valuations WHERE name = ?",
			[name],
			(err, row) => {
				if (err) {
					db.run("ROLLBACK");
					res.status(500).json({error: err.message});
					return;
				}

				if (row) {
					db.run("ROLLBACK");
					res.status(409).json({
						error: "Valuation model with this name already exists",
					});
					return;
				}

				// Create a new table name based on the model name (replace spaces and special chars with underscores)
				const tableName = `pick_values_${name
					.replace(/[^a-zA-Z0-9]/g, "_")
					.toLowerCase()}`;

				// Create the new table for the valuation model
				const createTableSql = `
				CREATE TABLE IF NOT EXISTS ${tableName} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					pick_position INTEGER NOT NULL,
					value REAL NOT NULL,
					normalized REAL NOT NULL
				)
			`;

				db.run(createTableSql, (err) => {
					if (err) {
						db.run("ROLLBACK");
						res.status(500).json({
							error: `Failed to create table: ${err.message}`,
						});
						return;
					}

					// Insert the new valuation model into the valuations table
					db.run(
						"INSERT INTO valuations (name, table_name, description) VALUES (?, ?, ?)",
						[
							name,
							tableName,
							description || `Custom valuation model: ${name}`,
						],
						function (err) {
							if (err) {
								db.run("ROLLBACK");
								res.status(500).json({
									error: `Failed to insert valuation model: ${err.message}`,
								});
								return;
							}

							const valuationId = this.lastID;

							// Prepare to insert all pick values into the new table
							const insertValueSql = `
							INSERT INTO ${tableName} (pick_position, value, normalized)
							VALUES (?, ?, ?)
						`;

							// Use a counter to track how many inserts have completed
							let insertCount = 0;
							let hasError = false;

							// Insert each value
							values.forEach((val) => {
								db.run(
									insertValueSql,
									[
										val.pick_position,
										val.value,
										val.normalized,
									],
									(err) => {
										if (hasError) return; // Skip if we already have an error

										if (err) {
											hasError = true;
											db.run("ROLLBACK");
											res.status(500).json({
												error: `Failed to insert pick value: ${err.message}`,
											});
											return;
										}

										insertCount++;

										// If all inserts are complete, commit the transaction and respond
										if (insertCount === values.length) {
											db.run("COMMIT", (err) => {
												if (err) {
													res.status(500).json({
														error: `Failed to commit transaction: ${err.message}`,
													});
													return;
												}

												res.status(201).json({
													id: valuationId,
													name: name,
													table_name: tableName,
													message:
														"Valuation model created successfully",
												});
											});
										}
									}
								);
							});
						}
					);
				});
			}
		);
	});
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
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

// Saved Trades API Routes

// Get all saved trades
app.get("/api/saved-trades", (req, res) => {
	// First get all trades
	const tradeSql = `
    SELECT id, created_at, trade_name
    FROM saved_trades
    ORDER BY created_at DESC
  `;

	db.all(tradeSql, [], (err, trades) => {
		if (err) {
			res.status(500).json({error: err.message});
			return;
		}

		if (trades.length === 0) {
			res.json([]);
			return;
		}

		// Prepare an array to collect all complete trade data
		const completeTradesData = [];
		let processedTradeCount = 0;

		// For each trade, get the teams involved
		trades.forEach((trade) => {
			const teamsSql = `
        SELECT st.*, t.id as team_id, t.name, t.abbreviation, t.logo
        FROM saved_trade_teams st
        JOIN teams t ON st.team_id = t.id
        WHERE st.saved_trade_id = ?
        ORDER BY st.team_order
      `;

			db.all(teamsSql, [trade.id], (err, teams) => {
				if (err) {
					console.error(
						`Error fetching teams for trade ${trade.id}:`,
						err.message
					);
					processedTradeCount++;

					if (processedTradeCount === trades.length) {
						res.json(completeTradesData);
					}
					return;
				}

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
				processedTradeCount++;

				if (processedTradeCount === trades.length) {
					res.json(completeTradesData);
				}
			});
		});
	});
});

// Get a specific saved trade with its picks
app.get("/api/saved-trades/:id", (req, res) => {
	const tradeId = req.params.id;

	// Get the trade details
	const tradeSql = `
    SELECT id, created_at, trade_name
    FROM saved_trades
    WHERE id = ?
  `;

	db.get(tradeSql, [tradeId], (err, trade) => {
		if (err) {
			res.status(500).json({error: err.message});
			return;
		}

		if (!trade) {
			res.status(404).json({error: "Trade not found"});
			return;
		}

		// Get the teams involved in the trade
		const teamsSql = `
      SELECT stt.team_order, t.id, t.name, t.abbreviation, t.logo
      FROM saved_trade_teams stt
      JOIN teams t ON stt.team_id = t.id
      WHERE stt.saved_trade_id = ?
      ORDER BY stt.team_order
    `;

		db.all(teamsSql, [tradeId], (err, teams) => {
			if (err) {
				res.status(500).json({error: err.message});
				return;
			}

			if (teams.length === 0) {
				res.status(404).json({error: "No teams found for this trade"});
				return;
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
        WHERE stp.saved_trade_id = ?
      `;

			db.all(picksSql, [tradeId], (err, picks) => {
				if (err) {
					res.status(500).json({error: err.message});
					return;
				}

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
						picksByTeam[pick.receiving_team_id].receiving.push(
							pick
						);
					}
				});

				res.json({
					...trade,
					teams,
					picksByTeam,
				});
			});
		});
	});
});

// Get a specific saved trade with data formatted for loading into trade builder
app.get("/api/trades/:id/full", (req, res) => {
	const tradeId = req.params.id;

	// Get the trade details
	const tradeSql = `
    SELECT id, created_at, trade_name, valuation_model_id
    FROM saved_trades
    WHERE id = ?
  `;

	db.get(tradeSql, [tradeId], (err, trade) => {
		if (err) {
			res.status(500).json({error: err.message});
			return;
		}

		if (!trade) {
			res.status(404).json({error: "Trade not found"});
			return;
		}

		// Get the teams involved in the trade
		const teamsSql = `
      SELECT stt.team_order, t.id, t.name, t.abbreviation, t.logo
      FROM saved_trade_teams stt
      JOIN teams t ON stt.team_id = t.id
      WHERE stt.saved_trade_id = ?
      ORDER BY stt.team_order
    `;

		db.all(teamsSql, [tradeId], (err, teams) => {
			if (err) {
				res.status(500).json({error: err.message});
				return;
			}

			if (teams.length === 0) {
				res.status(404).json({error: "No teams found for this trade"});
				return;
			}

			// Get all picks for all teams in this trade
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
        WHERE dp.team_id IN (${teams.map(() => "?").join(",")})
      `;

			const teamIds = teams.map((team) => team.id);

			db.all(allPicksSql, teamIds, (err, allPicks) => {
				if (err) {
					res.status(500).json({error: err.message});
					return;
				}

				// Get the picks involved in the trade
				const tradedPicksSql = `
          SELECT 
            stp.draft_pick_id,
            stp.sending_team_id,
            stp.receiving_team_id
          FROM saved_trade_picks stp
          WHERE stp.saved_trade_id = ?
        `;

				db.all(tradedPicksSql, [tradeId], (err, tradedPicks) => {
					if (err) {
						res.status(500).json({error: err.message});
						return;
					}

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
										pick.pick_number
											? ` (#${pick.pick_number})`
											: ""
									}`,
									pickId: pick.pick_id,
									year: pick.year,
									round: pick.round,
									pick_number: pick.pick_number,
									originalTeamLogo:
										pick.original_team_logo || team.logo,
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
									(p) =>
										parseInt(p.pickId) ===
										tradedPick.draft_pick_id
								);
								if (pickIndex !== -1) {
									teamPicks.splice(pickIndex, 1);
								}
							}

							// If this pick was received by this team
							if (tradedPick.receiving_team_id === team.id) {
								// Find the pick in all picks
								const receivedPick = allPicks.find(
									(p) =>
										p.pick_id === tradedPick.draft_pick_id
								);
								if (receivedPick) {
									// Find original team
									const originalTeam = teams.find(
										(t) =>
											t.id === tradedPick.sending_team_id
									);
									if (originalTeam) {
										// Add the received pick to this team's picks
										teamPicks.push({
											id: `pick-${receivedPick.pick_id}`,
											content: `${
												receivedPick.year
											} ${getOrdinalRound(
												receivedPick.round
											)} Pick${
												receivedPick.pick_number
													? ` (#${receivedPick.pick_number})`
													: ""
											}`,
											pickId: receivedPick.pick_id,
											year: receivedPick.year,
											round: receivedPick.round,
											pick_number:
												receivedPick.pick_number,
											originalTeamLogo: originalTeam.logo,
											originalTeamId:
												tradedPick.sending_team_id,
											originalTeamName: originalTeam.name,
											valuation:
												trade.valuation_model_id || 1,
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

					// Function to get ordinal round names
					function getOrdinalRound(round) {
						const ordinals = [
							"First",
							"Second",
							"Third",
							"Fourth",
							"Fifth",
							"Sixth",
							"Seventh",
						];
						return round >= 1 && round <= 7
							? ordinals[round - 1]
							: `Round ${round}`;
					}

					res.json({
						id: trade.id,
						trade_name: trade.trade_name,
						valuation_model_id: trade.valuation_model_id || 1,
						teamGroups: teamGroups,
					});
				});
			});
		});
	});
});

// Save a new trade
app.post("/api/saved-trades", (req, res) => {
	const {teams, trade_name, picks, valuation_model_id} = req.body;

	if (
		!teams ||
		!Array.isArray(teams) ||
		teams.length < 2 ||
		!picks ||
		!Array.isArray(picks)
	) {
		res.status(400).json({error: "Missing required parameters"});
		return;
	}

	// Begin transaction
	db.serialize(() => {
		db.run("BEGIN TRANSACTION");

		// Insert the trade
		db.run(
			"INSERT INTO saved_trades (trade_name, valuation_model_id) VALUES (?, ?)",
			[trade_name || null, valuation_model_id || 1],
			function (err) {
				if (err) {
					db.run("ROLLBACK");
					res.status(500).json({error: err.message});
					return;
				}

				const savedTradeId = this.lastID;
				let teamInsertCount = 0;
				const totalTeams = teams.length;

				// Insert teams
				teams.forEach((team, index) => {
					db.run(
						"INSERT INTO saved_trade_teams (saved_trade_id, team_id, team_order) VALUES (?, ?, ?)",
						[savedTradeId, team.id, index],
						function (err) {
							if (err) {
								db.run("ROLLBACK");
								res.status(500).json({error: err.message});
								return;
							}

							teamInsertCount++;

							if (teamInsertCount === totalTeams) {
								// All teams inserted, now insert picks
								if (picks.length === 0) {
									// No picks to insert, finalize the transaction
									db.run("COMMIT");
									res.status(201).json({
										id: savedTradeId,
										message: "Trade saved successfully",
									});
									return;
								}

								let pickInsertCount = 0;
								const totalPicks = picks.length;

								// Insert each pick
								picks.forEach((pick) => {
									db.run(
										"INSERT INTO saved_trade_picks (saved_trade_id, draft_pick_id, sending_team_id, receiving_team_id) VALUES (?, ?, ?, ?)",
										[
											savedTradeId,
											pick.draft_pick_id,
											pick.sending_team_id,
											pick.receiving_team_id,
										],
										function (err) {
											if (err) {
												db.run("ROLLBACK");
												res.status(500).json({
													error: err.message,
												});
												return;
											}

											pickInsertCount++;

											if (
												pickInsertCount === totalPicks
											) {
												// All picks inserted, finalize the transaction
												db.run("COMMIT");
												res.status(201).json({
													id: savedTradeId,
													message:
														"Trade saved successfully",
												});
											}
										}
									);
								});
							}
						}
					);
				});
			}
		);
	});
});

// Delete a saved trade
app.delete("/api/saved-trades/:id", (req, res) => {
	const tradeId = req.params.id;

	// Begin transaction
	db.serialize(() => {
		db.run("BEGIN TRANSACTION");

		// Delete picks first
		db.run(
			"DELETE FROM saved_trade_picks WHERE saved_trade_id = ?",
			[tradeId],
			function (err) {
				if (err) {
					db.run("ROLLBACK");
					res.status(500).json({error: err.message});
					return;
				}

				// Delete team associations
				db.run(
					"DELETE FROM saved_trade_teams WHERE saved_trade_id = ?",
					[tradeId],
					function (err) {
						if (err) {
							db.run("ROLLBACK");
							res.status(500).json({error: err.message});
							return;
						}

						// Delete the trade
						db.run(
							"DELETE FROM saved_trades WHERE id = ?",
							[tradeId],
							function (err) {
								if (err) {
									db.run("ROLLBACK");
									res.status(500).json({error: err.message});
									return;
								}

								if (this.changes === 0) {
									db.run("ROLLBACK");
									res.status(404).json({
										error: "Trade not found",
									});
									return;
								}

								db.run("COMMIT");
								res.json({
									message: "Trade deleted successfully",
								});
							}
						);
					}
				);
			}
		);
	});
});

module.exports = app;
