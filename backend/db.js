// Load environment variables for database connection
const {Pool} = require("pg");
const path = require("path");
require("dotenv").config(); // Load environment variables from .env file

// Load environment variables for database connection
const PG_HOST = process.env.PG_HOST || "localhost";
const PG_PORT = process.env.PG_PORT || 5432;
const PG_DATABASE = process.env.PG_DATABASE || "draft_trade_analyzer";
const PG_USER = process.env.PG_USER || process.env.USER || "postgres";
const PG_PASSWORD = process.env.PG_PASSWORD || "";

console.log(
	`Database configuration: PG_HOST=${PG_HOST}, PG_USER=${PG_USER}, PG_DATABASE=${PG_DATABASE}`
);

// Create PostgreSQL connection pool using config
const db = new Pool({
	host: PG_HOST,
	port: PG_PORT,
	database: PG_DATABASE,
	user: PG_USER,
	password: PG_PASSWORD,
});

// Test PostgreSQL connection
db.connect((err) => {
	if (err) {
		console.error("Error connecting to PostgreSQL database:", err.message);
	} else {
		console.log("Connected to PostgreSQL database");
	}
});

// Helper to run SELECT queries and return all rows
async function query(sql, params = []) {
	try {
		const result = await db.query(sql, params);
		return result.rows;
	} catch (err) {
		throw err;
	}
}

// Helper to run write queries (INSERT, UPDATE, DELETE)
async function execute(sql, params = []) {
	try {
		return await db.query(sql, params);
	} catch (err) {
		throw err;
	}
}

// Helper to fetch a single row
async function getOne(sql, params = []) {
	try {
		const result = await db.query(sql, params);
		return result.rows.length > 0 ? result.rows[0] : null;
	} catch (err) {
		throw err;
	}
}

// Gracefully close database connection
function close() {
	return db.end();
}

module.exports = {
	db,
	query,
	execute,
	getOne,
	close,
};
