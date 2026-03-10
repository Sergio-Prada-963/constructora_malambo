require("dotenv").config();
const { DB_HOST = "localhost", DB_PORT = 3306, DB_USER = "root", DB_PASSWORD = "", DB_NAME = "constructora_malambo", TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;

if (TURSO_DATABASE_URL) {
	// Use libsql client for Turso (SQLite-compatible)
	const { createClient } = require("@libsql/client");
	const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

	// Provide a minimal `query` interface compatible with mysql2 pool.query
	module.exports = {
		execute: async (sql, params) => {
			// alias for direct execute
			const res = await client.execute(sql, params || []);
			return res;
		},
		query: async (sql, params) => {
			const res = await client.execute(sql, params || []);
			// return shape similar to mysql2: [rows, fields]
			return [res.rows || [], res.columns || []];
		},
		client,
	};
} else {
	const mysql = require("mysql2/promise");
	const pool = mysql.createPool({
		host: DB_HOST,
		port: DB_PORT,
		user: DB_USER,
		password: DB_PASSWORD,
		database: DB_NAME,
		waitForConnections: true,
		connectionLimit: 10,
		charset: "utf8mb4",
	});

	module.exports = pool;
}
