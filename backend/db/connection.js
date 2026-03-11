require("dotenv").config();
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMxNzk3OTcsImlkIjoiMDE5Y2Q5YzAtODAwMS03NjdkLTkyN2MtYzc2NDFlNTAwM2IzIiwicmlkIjoiMDFhYWUzYjUtOGEzMC00ZWZhLWJmZGMtOGFlNmE4ZThiZGM2In0.32A79nD5GSoqOUXwV6PW_jSs4rj5uSaudDeB9DN1u8KJazt0NKY3Cz8hyrcgNwVUniTT4jB6ER3MakIIT1b9Bg"
const TURSO_DATABASE_URL= "libsql://constructora-malambo-vercel-icfg-g2qdowi50jqhsmdvdgbm1zai.aws-us-east-1.turso.io"

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
