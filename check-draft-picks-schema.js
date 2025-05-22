const {Pool} = require("pg");
require("dotenv").config();

// Get PostgreSQL connection details from environment variables
const pool = new Pool({
	host: process.env.DB_HOST || "localhost",
	port: process.env.DB_PORT || 5432,
	database: process.env.DB_NAME || "draft_trade_analyzer",
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
});

async function checkTableSchema() {
	const client = await pool.connect();

	try {
		console.log("Connected to PostgreSQL database");

		// Check if draft_picks table exists
		const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'draft_picks'
      );
    `);

		if (!tableCheck.rows[0].exists) {
			console.log("Table draft_picks does not exist");
			return;
		}

		// Get column information
		const columnsQuery = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'draft_picks'
      ORDER BY ordinal_position;
    `);

		console.log("Columns in draft_picks table:");
		columnsQuery.rows.forEach((column) => {
			console.log(
				`- ${column.column_name}: ${column.data_type}${
					column.character_maximum_length
						? `(${column.character_maximum_length})`
						: ""
				} ${column.is_nullable === "YES" ? "NULL" : "NOT NULL"}`
			);
		});

		// Get row count
		const countQuery = await client.query(
			"SELECT COUNT(*) FROM draft_picks"
		);
		console.log(`\nTotal rows in draft_picks: ${countQuery.rows[0].count}`);

		// Get sample data
		const sampleData = await client.query(
			"SELECT * FROM draft_picks LIMIT 5"
		);
		console.log("\nSample data:");
		console.log(sampleData.rows);
	} catch (err) {
		console.error("Error checking schema:", err);
	} finally {
		client.release();
		pool.end();
	}
}

checkTableSchema();
