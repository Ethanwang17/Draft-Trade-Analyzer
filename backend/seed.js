const path = require("path");
const {db, query, execute, getOne} = require("./db");

console.log(`Using database type: postgres for seeding`);

// Initialize database tables
async function initializeDatabase() {
	console.log("Creating database tables if they don't exist...");

	// Create Teams table
	await execute(`CREATE TABLE IF NOT EXISTS teams (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL,
		abbreviation TEXT NOT NULL,
		logo TEXT
	)`);
	console.log("Teams table is ready");

	// Create Draft Picks table with valuation column
	await execute(`CREATE TABLE IF NOT EXISTS draft_picks (
		id SERIAL PRIMARY KEY,
		team_id INTEGER,
		year INTEGER NOT NULL,
		round INTEGER NOT NULL,
		pick_number INTEGER,
		valuation INTEGER DEFAULT 1,
		FOREIGN KEY (team_id) REFERENCES teams (id)
	)`);
	console.log("Draft Picks table is ready");

	// Create Valuations table
	await execute(`CREATE TABLE IF NOT EXISTS valuations (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL,
		table_name TEXT NOT NULL,
		description TEXT
	)`);
	console.log("Valuations table is ready");

	// Create valuation_1 table (previously pick_values)
	await execute(`CREATE TABLE IF NOT EXISTS valuation_1 (
		pick_position INTEGER PRIMARY KEY,
		value NUMERIC NOT NULL,
		normalized NUMERIC NOT NULL
	)`);
	console.log("Valuation_1 table is ready");

	// Create valuation_2 table
	await execute(`CREATE TABLE IF NOT EXISTS valuation_2 (
		pick_number INTEGER PRIMARY KEY,
		value INTEGER,
		normalized NUMERIC
	)`);
	console.log("Valuation_2 table is ready");

	// Create valuation_3 table
	await execute(`CREATE TABLE IF NOT EXISTS valuation_3 (
		pick_number INTEGER PRIMARY KEY,
		value INTEGER,
		normalized NUMERIC
	)`);
	console.log("Valuation_3 table is ready");

	// Create Saved Trades table
	await execute(`CREATE TABLE IF NOT EXISTS saved_trades (
		id SERIAL PRIMARY KEY,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		trade_name TEXT,
		valuation_model_id INTEGER DEFAULT 1 REFERENCES valuations(id)
	)`);
	console.log("Saved Trades table is ready");

	// Create Saved Trade Teams table
	await execute(`CREATE TABLE IF NOT EXISTS saved_trade_teams (
		id SERIAL PRIMARY KEY,
		saved_trade_id INTEGER NOT NULL,
		team_id INTEGER NOT NULL,
		team_order INTEGER NOT NULL, 
		FOREIGN KEY (saved_trade_id) REFERENCES saved_trades (id),
		FOREIGN KEY (team_id) REFERENCES teams (id)
	)`);
	console.log("Saved Trade Teams table is ready");

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
	console.log("Saved Trade Picks table is ready");

	// Start seeding data after tables are created
	await seedDatabase();
}

async function seedDatabase() {
	try {
		// Clear existing data
		await execute("DELETE FROM saved_trade_picks");
		await execute("DELETE FROM saved_trade_teams");
		await execute("DELETE FROM saved_trades");
		await execute("DELETE FROM valuation_3");
		await execute("DELETE FROM valuation_2");
		await execute("DELETE FROM valuation_1");
		await execute("DELETE FROM valuations");
		await execute("DELETE FROM draft_picks");
		await execute("DELETE FROM teams");

		// Seed NBA Teams
		const teams = [
			// Atlantic Division (Eastern Conference)
			{
				name: "Boston Celtics",
				abbreviation: "BOS",
				logo: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
			},
			{
				name: "Brooklyn Nets",
				abbreviation: "BKN",
				logo: "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
			},
			{
				name: "New York Knicks",
				abbreviation: "NYK",
				logo: "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
			},
			{
				name: "Philadelphia 76ers",
				abbreviation: "PHI",
				logo: "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg",
			},
			{
				name: "Toronto Raptors",
				abbreviation: "TOR",
				logo: "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg",
			},

			// Central Division (Eastern Conference)
			{
				name: "Chicago Bulls",
				abbreviation: "CHI",
				logo: "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
			},
			{
				name: "Cleveland Cavaliers",
				abbreviation: "CLE",
				logo: "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg",
			},
			{
				name: "Detroit Pistons",
				abbreviation: "DET",
				logo: "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg",
			},
			{
				name: "Indiana Pacers",
				abbreviation: "IND",
				logo: "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg",
			},
			{
				name: "Milwaukee Bucks",
				abbreviation: "MIL",
				logo: "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
			},

			// Southeast Division (Eastern Conference)
			{
				name: "Atlanta Hawks",
				abbreviation: "ATL",
				logo: "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg",
			},
			{
				name: "Charlotte Hornets",
				abbreviation: "CHA",
				logo: "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
			},
			{
				name: "Miami Heat",
				abbreviation: "MIA",
				logo: "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
			},
			{
				name: "Orlando Magic",
				abbreviation: "ORL",
				logo: "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
			},
			{
				name: "Washington Wizards",
				abbreviation: "WAS",
				logo: "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg",
			},

			// Northwest Division (Western Conference)
			{
				name: "Denver Nuggets",
				abbreviation: "DEN",
				logo: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
			},
			{
				name: "Minnesota Timberwolves",
				abbreviation: "MIN",
				logo: "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg",
			},
			{
				name: "Oklahoma City Thunder",
				abbreviation: "OKC",
				logo: "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg",
			},
			{
				name: "Portland Trail Blazers",
				abbreviation: "POR",
				logo: "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg",
			},
			{
				name: "Utah Jazz",
				abbreviation: "UTA",
				logo: "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
			},

			// Pacific Division (Western Conference)
			{
				name: "Golden State Warriors",
				abbreviation: "GSW",
				logo: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
			},
			{
				name: "Los Angeles Clippers",
				abbreviation: "LAC",
				logo: "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg",
			},
			{
				name: "Los Angeles Lakers",
				abbreviation: "LAL",
				logo: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
			},
			{
				name: "Phoenix Suns",
				abbreviation: "PHX",
				logo: "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
			},
			{
				name: "Sacramento Kings",
				abbreviation: "SAC",
				logo: "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg",
			},

			// Southwest Division (Western Conference)
			{
				name: "Dallas Mavericks",
				abbreviation: "DAL",
				logo: "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
			},
			{
				name: "Houston Rockets",
				abbreviation: "HOU",
				logo: "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg",
			},
			{
				name: "Memphis Grizzlies",
				abbreviation: "MEM",
				logo: "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg",
			},
			{
				name: "New Orleans Pelicans",
				abbreviation: "NOP",
				logo: "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
			},
			{
				name: "San Antonio Spurs",
				abbreviation: "SAS",
				logo: "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
			},
		];

		console.log("Seeding teams...");
		for (const team of teams) {
			await execute(
				"INSERT INTO teams (name, abbreviation, logo) VALUES ($1, $2, $3)",
				[team.name, team.abbreviation, team.logo]
			);
		}
		console.log(`Seeded ${teams.length} teams`);

		// Updated Draft Pick Values
		const pickValues = [
			{pick_position: 1, value: 4000, normalized: 100.0},
			{pick_position: 2, value: 3100, normalized: 77.5},
			{pick_position: 3, value: 2670, normalized: 66.75},
			{pick_position: 4, value: 2410, normalized: 60.25},
			{pick_position: 5, value: 2240, normalized: 56.0},
			{pick_position: 6, value: 2110, normalized: 52.75},
			{pick_position: 7, value: 2000, normalized: 50.0},
			{pick_position: 8, value: 1910, normalized: 47.75},
			{pick_position: 9, value: 1830, normalized: 45.75},
			{pick_position: 10, value: 1720, normalized: 43.0},
			{pick_position: 11, value: 1600, normalized: 40.0},
			{pick_position: 12, value: 1500, normalized: 37.5},
			{pick_position: 13, value: 1400, normalized: 35.0},
			{pick_position: 14, value: 1320, normalized: 33.0},
			{pick_position: 15, value: 1240, normalized: 31.0},
			{pick_position: 16, value: 1180, normalized: 29.5},
			{pick_position: 17, value: 1130, normalized: 28.25},
			{pick_position: 18, value: 1080, normalized: 27.0},
			{pick_position: 19, value: 1030, normalized: 25.75},
			{pick_position: 20, value: 980, normalized: 24.5},
			{pick_position: 21, value: 920, normalized: 23.0},
			{pick_position: 22, value: 860, normalized: 21.5},
			{pick_position: 23, value: 800, normalized: 20.0},
			{pick_position: 24, value: 750, normalized: 18.75},
			{pick_position: 25, value: 700, normalized: 17.5},
			{pick_position: 26, value: 660, normalized: 16.5},
			{pick_position: 27, value: 620, normalized: 15.5},
			{pick_position: 28, value: 570, normalized: 14.25},
			{pick_position: 29, value: 520, normalized: 13.0},
			{pick_position: 30, value: 470, normalized: 11.75},
			{pick_position: 31, value: 360, normalized: 9.0},
			{pick_position: 32, value: 350, normalized: 8.75},
			{pick_position: 33, value: 330, normalized: 8.25},
			{pick_position: 34, value: 320, normalized: 8.0},
			{pick_position: 35, value: 300, normalized: 7.5},
			{pick_position: 36, value: 290, normalized: 7.25},
			{pick_position: 37, value: 280, normalized: 7.0},
			{pick_position: 38, value: 270, normalized: 6.75},
			{pick_position: 39, value: 250, normalized: 6.25},
			{pick_position: 40, value: 240, normalized: 6.0},
			{pick_position: 41, value: 230, normalized: 5.75},
			{pick_position: 42, value: 220, normalized: 5.5},
			{pick_position: 43, value: 210, normalized: 5.25},
			{pick_position: 44, value: 200, normalized: 5.0},
			{pick_position: 45, value: 190, normalized: 4.75},
			{pick_position: 46, value: 180, normalized: 4.5},
			{pick_position: 47, value: 170, normalized: 4.25},
			{pick_position: 48, value: 160, normalized: 4.0},
			{pick_position: 49, value: 150, normalized: 3.75},
			{pick_position: 50, value: 140, normalized: 3.5},
			{pick_position: 51, value: 130, normalized: 3.25},
			{pick_position: 52, value: 120, normalized: 3.0},
			{pick_position: 53, value: 110, normalized: 2.75},
			{pick_position: 54, value: 100, normalized: 2.5},
			{pick_position: 55, value: 90, normalized: 2.25},
			{pick_position: 56, value: 90, normalized: 2.25},
			{pick_position: 57, value: 80, normalized: 2.0},
			{pick_position: 58, value: 70, normalized: 1.75},
			{pick_position: 59, value: 60, normalized: 1.5},
			{pick_position: 60, value: 50, normalized: 1.25},
		];

		console.log("Seeding valuation_1 values...");
		for (const pick of pickValues) {
			await execute(
				"INSERT INTO valuation_1 (pick_position, value, normalized) VALUES ($1, $2, $3)",
				[pick.pick_position, pick.value, pick.normalized]
			);
		}
		console.log(`Seeded ${pickValues.length} valuation_1 values`);

		// Insert specific valuation_2 data
		console.log("Seeding valuation_2 values...");
		const valuation2Data = [
			{pick_number: 1, value: 778, normalized: 100},
			{pick_number: 2, value: 729, normalized: 93.7},
			{pick_number: 3, value: 682, normalized: 87.66},
			{pick_number: 4, value: 637, normalized: 81.88},
			{pick_number: 5, value: 594, normalized: 76.35},
			{pick_number: 6, value: 553, normalized: 71.08},
			{pick_number: 7, value: 514, normalized: 66.07},
			{pick_number: 8, value: 477, normalized: 61.31},
			{pick_number: 9, value: 443, normalized: 56.94},
			{pick_number: 10, value: 411, normalized: 52.83},
			{pick_number: 11, value: 381, normalized: 48.97},
			{pick_number: 12, value: 353, normalized: 45.37},
			{pick_number: 13, value: 327, normalized: 42.03},
			{pick_number: 14, value: 302, normalized: 38.82},
			{pick_number: 15, value: 279, normalized: 35.86},
			{pick_number: 16, value: 258, normalized: 33.16},
			{pick_number: 17, value: 241, normalized: 30.98},
			{pick_number: 18, value: 228, normalized: 29.31},
			{pick_number: 19, value: 216, normalized: 27.76},
			{pick_number: 20, value: 206, normalized: 26.48},
			{pick_number: 21, value: 197, normalized: 25.32},
			{pick_number: 22, value: 188, normalized: 24.16},
			{pick_number: 23, value: 178, normalized: 22.88},
			{pick_number: 24, value: 168, normalized: 21.59},
			{pick_number: 25, value: 158, normalized: 20.31},
			{pick_number: 26, value: 149, normalized: 19.15},
			{pick_number: 27, value: 141, normalized: 18.12},
			{pick_number: 28, value: 133, normalized: 17.1},
			{pick_number: 29, value: 126, normalized: 16.2},
			{pick_number: 30, value: 119, normalized: 15.3},
			{pick_number: 31, value: 112, normalized: 14.4},
			{pick_number: 32, value: 106, normalized: 13.62},
			{pick_number: 33, value: 100, normalized: 12.85},
			{pick_number: 34, value: 95, normalized: 12.21},
			{pick_number: 35, value: 91, normalized: 11.7},
			{pick_number: 36, value: 86, normalized: 11.05},
			{pick_number: 37, value: 82, normalized: 10.54},
			{pick_number: 38, value: 78, normalized: 10.03},
			{pick_number: 39, value: 74, normalized: 9.51},
			{pick_number: 40, value: 71, normalized: 9.13},
			{pick_number: 41, value: 68, normalized: 8.74},
			{pick_number: 42, value: 66, normalized: 8.48},
			{pick_number: 43, value: 64, normalized: 8.23},
			{pick_number: 44, value: 61, normalized: 7.84},
			{pick_number: 45, value: 58, normalized: 7.46},
			{pick_number: 46, value: 55, normalized: 7.07},
			{pick_number: 47, value: 52, normalized: 6.68},
			{pick_number: 48, value: 49, normalized: 6.3},
			{pick_number: 49, value: 47, normalized: 6.04},
			{pick_number: 50, value: 44, normalized: 5.66},
			{pick_number: 51, value: 42, normalized: 5.4},
			{pick_number: 52, value: 39, normalized: 5.01},
			{pick_number: 53, value: 37, normalized: 4.76},
			{pick_number: 54, value: 34, normalized: 4.37},
			{pick_number: 55, value: 31, normalized: 3.98},
			{pick_number: 56, value: 28, normalized: 3.6},
			{pick_number: 57, value: 26, normalized: 3.34},
			{pick_number: 58, value: 23, normalized: 2.96},
			{pick_number: 59, value: 20, normalized: 2.57},
			{pick_number: 60, value: 17, normalized: 2.19},
		];

		for (const item of valuation2Data) {
			await execute(
				"INSERT INTO valuation_2 (pick_number, value, normalized) VALUES ($1, $2, $3)",
				[item.pick_number, item.value, item.normalized]
			);
		}
		console.log("Seeded valuation_2 values");

		console.log("Seeding valuation_3 values...");
		const valuation3Data = [
			{pick_number: 1, value: 57138, normalized: 100},
			{pick_number: 2, value: 47758, normalized: 83.58},
			{pick_number: 3, value: 42271, normalized: 73.98},
			{pick_number: 4, value: 38378, normalized: 67.17},
			{pick_number: 5, value: 35358, normalized: 61.88},
			{pick_number: 6, value: 32891, normalized: 57.56},
			{pick_number: 7, value: 30805, normalized: 53.91},
			{pick_number: 8, value: 28998, normalized: 50.75},
			{pick_number: 9, value: 27404, normalized: 47.96},
			{pick_number: 10, value: 25978, normalized: 45.47},
			{pick_number: 11, value: 24688, normalized: 43.21},
			{pick_number: 12, value: 23511, normalized: 41.15},
			{pick_number: 13, value: 22427, normalized: 39.25},
			{pick_number: 14, value: 21425, normalized: 37.5},
			{pick_number: 15, value: 20491, normalized: 35.86},
			{pick_number: 16, value: 19618, normalized: 34.33},
			{pick_number: 17, value: 18797, normalized: 32.9},
			{pick_number: 18, value: 18024, normalized: 31.54},
			{pick_number: 19, value: 17292, normalized: 30.26},
			{pick_number: 20, value: 16598, normalized: 29.05},
			{pick_number: 21, value: 15938, normalized: 27.89},
			{pick_number: 22, value: 15308, normalized: 26.79},
			{pick_number: 23, value: 14706, normalized: 25.74},
			{pick_number: 24, value: 14131, normalized: 24.73},
			{pick_number: 25, value: 13578, normalized: 23.76},
			{pick_number: 26, value: 13047, normalized: 22.83},
			{pick_number: 27, value: 12537, normalized: 21.94},
			{pick_number: 28, value: 12045, normalized: 21.08},
			{pick_number: 29, value: 11570, normalized: 20.25},
			{pick_number: 30, value: 11111, normalized: 19.45},
			{pick_number: 31, value: 10667, normalized: 18.67},
			{pick_number: 32, value: 10237, normalized: 17.92},
			{pick_number: 33, value: 9821, normalized: 17.19},
			{pick_number: 34, value: 9417, normalized: 16.48},
			{pick_number: 35, value: 9025, normalized: 15.8},
			{pick_number: 36, value: 8644, normalized: 15.13},
			{pick_number: 37, value: 8273, normalized: 14.48},
			{pick_number: 38, value: 7912, normalized: 13.85},
			{pick_number: 39, value: 7560, normalized: 13.23},
			{pick_number: 40, value: 7218, normalized: 12.63},
			{pick_number: 41, value: 6884, normalized: 12.05},
			{pick_number: 42, value: 6558, normalized: 11.48},
			{pick_number: 43, value: 6239, normalized: 10.92},
			{pick_number: 44, value: 5928, normalized: 10.37},
			{pick_number: 45, value: 5624, normalized: 9.84},
			{pick_number: 46, value: 5326, normalized: 9.32},
			{pick_number: 47, value: 5035, normalized: 8.81},
			{pick_number: 48, value: 4751, normalized: 8.31},
			{pick_number: 49, value: 4471, normalized: 7.82},
			{pick_number: 50, value: 4198, normalized: 7.35},
			{pick_number: 51, value: 3930, normalized: 6.88},
			{pick_number: 52, value: 3667, normalized: 6.42},
			{pick_number: 53, value: 3410, normalized: 5.97},
			{pick_number: 54, value: 3157, normalized: 5.53},
			{pick_number: 55, value: 2908, normalized: 5.09},
			{pick_number: 56, value: 2664, normalized: 4.66},
			{pick_number: 57, value: 2425, normalized: 4.24},
			{pick_number: 58, value: 2190, normalized: 3.83},
			{pick_number: 59, value: 1958, normalized: 3.43},
			{pick_number: 60, value: 1731, normalized: 3.03},
		];

		for (const item of valuation3Data) {
			await execute(
				"INSERT INTO valuation_3 (pick_number, value, normalized) VALUES ($1, $2, $3)",
				[item.pick_number, item.value, item.normalized]
			);
		}
		console.log("Seeded valuation_3 values");

		// Add valuation models
		console.log("Seeding valuation models...");
		await execute(
			"INSERT INTO valuations (id, name, table_name, description) VALUES ($1, $2, $3, $4)",
			[1, "Pelton 2017", "valuation_1", "ESPN model from 2017"]
		);

		await execute(
			"INSERT INTO valuations (id, name, table_name, description) VALUES ($1, $2, $3, $4)",
			[2, "Restifo 2016", "valuation_2", "Data-Driven Sports model"]
		);

		await execute(
			"INSERT INTO valuations (id, name, table_name, description) VALUES ($1, $2, $3, $4)",
			[3, "Custom", "valuation_3", "User-defined values"]
		);
		console.log("Seeded valuation models");

		// Create draft picks for each team (2025-2031)
		console.log("Seeding draft picks...");
		const teams_data = await query("SELECT id FROM teams ORDER BY id");

		const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031];
		const rounds = [1, 2];

		for (const year of years) {
			for (const round of rounds) {
				let pickNumber = (round - 1) * 30 + 1;
				for (const team of teams_data) {
					await execute(
						"INSERT INTO draft_picks (team_id, year, round, pick_number) VALUES ($1, $2, $3, $4)",
						[team.id, year, round, pickNumber]
					);
					pickNumber++;
				}
			}
		}
		console.log("Seeded draft picks");

		console.log("Database seeding completed successfully");
	} catch (error) {
		console.error("Error seeding database:", error);
	}
}

// Run the initialization
initializeDatabase().catch((err) => {
	console.error("Database initialization failed:", err);
	process.exit(1);
});
