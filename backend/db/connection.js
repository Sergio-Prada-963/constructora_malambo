require("dotenv").config();
const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;

if (!TURSO_DATABASE_URL) {
	console.error("TURSO_DATABASE_URL is not set. This service requires Turso. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment.");
	throw new Error("Missing TURSO_DATABASE_URL");
}

// Use libsql client for Turso (SQLite-compatible)
const { createClient } = require("@libsql/client");
const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

// Provide a minimal `query` interface compatible with mysql2 pool.query
module.exports = {
	execute: async (sql, params) => {
		try {
			const res = await client.execute(sql, params || []);
			return res;
		} catch (err) {
			console.error("Turso execute error:", err && err.message ? err.message : err);
			console.error(err && err.stack ? err.stack : err);
			throw err;
		}
	},
	query: async (sql, params) => {
		try {
			const res = await client.execute(sql, params || []);
			return [res.rows || [], res.columns || []];
		} catch (err) {
			console.error("Turso query error:", err && err.message ? err.message : err);
			console.error(err && err.stack ? err.stack : err);
			throw err;
		}
	},
	client,
};
