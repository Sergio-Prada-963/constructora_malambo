require("dotenv").config();
const mysql = require("mysql2/promise");

const { DB_HOST = "localhost", DB_PORT = 3306, DB_USER = "root", DB_PASSWORD = "", DB_NAME = "constructora_malambo" } = process.env;

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
