require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const { DB_HOST = "localhost", DB_PORT = 3306, DB_USER = "root", DB_PASSWORD = "", DB_NAME = "constructora_malambo" } = process.env;

(async () => {
	try {
		const connection = await mysql.createConnection({
			host: DB_HOST,
			port: DB_PORT,
			user: DB_USER,
			password: DB_PASSWORD,
			multipleStatements: true,
		});

		await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
		console.log(`Base de datos "${DB_NAME}" creada (o ya existía).`);

		// Usar la base de datos creada
		await connection.changeUser({ database: DB_NAME });

		// Crear tabla users si no existe
		const createUsersSQL = `
			CREATE TABLE IF NOT EXISTS users (
				id INT PRIMARY KEY AUTO_INCREMENT,
				name VARCHAR(255) NOT NULL,
				username VARCHAR(255) NOT NULL UNIQUE,
				email VARCHAR(255) NOT NULL UNIQUE,
				password VARCHAR(255) NOT NULL,
				role VARCHAR(50) DEFAULT 'user',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		`;
		await connection.query(createUsersSQL);
		console.log("Tabla 'users' creada.");

		// Crear tabla payments
		// Determinar tipos de columna para claves foráneas (compatibilidad con esquemas existentes)
		const getColumnType = async (table, column) => {
			try {
				const [rows] = await connection.query(
					"SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
					[DB_NAME, table, column]
				);
				if (rows && rows.length > 0) return rows[0].COLUMN_TYPE;
				return null;
			} catch (e) {
				return null;
			}
		};

		const userIdType = (await getColumnType("users", "id")) || "INT";
		const projectIdType = (await getColumnType("projects", "id")) || "INT";

		const createPaymentsSQL = `
			CREATE TABLE IF NOT EXISTS payments (
				id INT PRIMARY KEY AUTO_INCREMENT,
				project_id ${projectIdType},
				user_id ${userIdType} NOT NULL,
				valor DECIMAL(15,2) NOT NULL,
				cuotas_nro INT NOT NULL,
				fecha_pago DATE NOT NULL,
				total_cuotas INT NOT NULL,
				intereses DECIMAL(15,2) DEFAULT 0.00,
				aporte_capital DECIMAL(15,2) DEFAULT 0.00,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		`;
		await connection.query(createPaymentsSQL);
		console.log("Tabla 'payments' creada.");
		// Crear tabla user_lotes
		const createUserLotesSQL = `
			CREATE TABLE IF NOT EXISTS user_lotes (
				id INT PRIMARY KEY AUTO_INCREMENT,
				user_id ${userIdType} NOT NULL,
				project_id ${projectIdType},
				lote_name VARCHAR(255),
				fecha_compra DATE NOT NULL,
				numero_cuotas INT NOT NULL,
				pagos_ids TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		`;
		await connection.query(createUserLotesSQL);
		console.log("Tabla 'user_lotes' creada.");
		// Crear tabla projects si no existe
		const createProjectsSQL = `
			CREATE TABLE IF NOT EXISTS projects (
				id INT PRIMARY KEY AUTO_INCREMENT,
				img VARCHAR(512),
				nombre VARCHAR(255) NOT NULL,
				descripcion TEXT,
				largo DECIMAL(10,2) DEFAULT 0,
				ancho DECIMAL(10,2) DEFAULT 0,
				precio DECIMAL(12,2) DEFAULT 0,
				ubicacion VARCHAR(255),
				banos INT DEFAULT 0,
				habitaciones INT DEFAULT 0,
				comedor INT DEFAULT 0,
				sala INT DEFAULT 0,
				cocina INT DEFAULT 0,
				cantidad_disponible INT DEFAULT 0,
				etapa VARCHAR(50) DEFAULT 'planificacion',
				estado VARCHAR(50) DEFAULT 'disponible',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		`;
		await connection.query(createProjectsSQL);
		console.log("Tabla 'projects' creada o ya existía.");

		// Insertar proyectos de ejemplo si la tabla está vacía
		// Asegurar columna 'etapa' si la tabla ya existía (seguro contra versiones previas)
		// Asegurar columnas 'etapa' y 'estado' si la tabla ya existía
		try {
			await connection.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS etapa VARCHAR(50) DEFAULT 'planificacion'");
			await connection.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'disponible'");
		} catch (e) {
			try {
				await connection.query("ALTER TABLE projects ADD COLUMN etapa VARCHAR(50) DEFAULT 'planificacion'");
			} catch (err) {}
			try {
				await connection.query("ALTER TABLE projects ADD COLUMN estado VARCHAR(50) DEFAULT 'disponible'");
			} catch (err) {}
		}

		const [projRows] = await connection.query("SELECT id FROM projects LIMIT 1");
		// Solo insertar proyectos de ejemplo si la tabla está vacía y tiene las columnas esperadas
		const projectHasColumns = !!(await getColumnType("projects", "nombre"));
		if ((!projRows || projRows.length === 0) && projectHasColumns) {
			const sampleProjects = [
				["https://images.pexels.com/photos/37347/house-home-sweet-home-architecture-37347.jpeg", "Lote Palmas del Norte", "Hermoso lote en zona tranquila, ideal para construir la casa de tus sueños.", 12.5, 10.0, 180000000, "Barranquilla", 1, 3, 1, 1, 1, 5, "planificacion", "disponible"],
				["https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg", "Villa Campestre", "Casa campestre con amplias zonas verdes y acabado de lujo.", 20.0, 18.0, 310000000, "Zona Rural", 3, 4, 1, 1, 1, 2, "Diseño", "reservado"],
				["https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg", "Lote Horizonte", "Proyecto de lotes con subsidios y planos aprobados.", 8.0, 6.5, 120000000, "Centro", 0, 0, 0, 0, 0, 10, "Preconstruccion", "disponible"],
			];

			for (const p of sampleProjects) {
				await connection.query("INSERT INTO projects (img, nombre, descripcion, largo, ancho, precio, ubicacion, banos, habitaciones, comedor, sala, cocina, cantidad_disponible, etapa, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", p);
			}
			console.log("Proyectos de ejemplo insertados.");
		} else if (!projectHasColumns) {
			console.log("La tabla 'projects' existe pero no tiene las columnas esperadas. No se insertaron ejemplos.");
		} else {
			console.log("La tabla projects ya tiene datos. No se insertaron ejemplos.");
		}

		// Insertar usuario admin si no existe
		const adminEmail = "admin@gmail.com";
		const adminUsername = "admin";
		const adminName = "Administrador";
		const adminPlain = "123";
		const saltRounds = 10;
		const [rows] = await connection.query("SELECT id FROM users WHERE email = ?", [adminEmail]);
		const usersHasUsername = !!(await getColumnType("users", "username"));
		if (!rows || rows.length === 0) {
			const hash = await bcrypt.hash(adminPlain, saltRounds);
			if (usersHasUsername) {
				await connection.query("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)", [adminName, adminUsername, adminEmail, hash]);
			} else {
				await connection.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [adminName, adminEmail, hash]);
			}
			console.log("Usuario admin creado.");
		} else {
			console.log("Usuario admin ya existe, no se creó.");
		}

		// Insertar usuario de prueba con id=2
		const testEmail = "test@example.com";
		const testUsername = "testuser";
		const testName = "Usuario de Prueba";
		const testPlain = "123";
		const [testRows] = await connection.query("SELECT id FROM users WHERE email = ?", [testEmail]);
		if (!testRows || testRows.length === 0) {
			const hash = await bcrypt.hash(testPlain, saltRounds);
			if (usersHasUsername) {
				await connection.query("INSERT INTO users (id, name, username, email, password) VALUES (?, ?, ?, ?, ?)", [2, testName, testUsername, testEmail, hash]);
			} else {
				await connection.query("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)", [2, testName, testEmail, hash]);
			}
			console.log("Usuario de prueba creado con id=2.");
		}

		// Insertar pagos de ejemplo
		const paymentsData = [
			[1, 1, 500000.0, 1, "2026-01-15", 12, 25000.0, 475000.0],
			[1, 1, 500000.0, 2, "2026-02-15", 12, 24000.0, 476000.0],
			[2, 1, 300000.0, 1, "2026-03-01", 8, 15000.0, 285000.0],
			[1, 2, 400000.0, 1, "2026-01-20", 10, 20000.0, 380000.0],
			[2, 2, 350000.0, 1, "2026-02-10", 8, 17500.0, 332500.0],
		];
		for (const payment of paymentsData) {
			await connection.query("INSERT INTO payments (project_id, user_id, valor, cuotas_nro, fecha_pago, total_cuotas, intereses, aporte_capital) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", payment);
		}
		console.log("Pagos de ejemplo insertados.");

		// Crear tabla pqr si no existe
		const createPqrSQL = `
			CREATE TABLE IF NOT EXISTS pqr (
				id INT PRIMARY KEY AUTO_INCREMENT,
				usuario_id ${userIdType},
				tipo_pqr VARCHAR(20) NOT NULL,
				estado VARCHAR(50) DEFAULT 'radicad',
				consecutivo VARCHAR(100) UNIQUE,
				fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
				nombre VARCHAR(255),
				descripcion TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		`;
		await connection.query(createPqrSQL);
		console.log("Tabla 'pqr' creada o ya existía.");

		// Insertar PQRs de ejemplo si la tabla está vacía
		const [pqrRows] = await connection.query("SELECT id FROM pqr LIMIT 1");
		if (!pqrRows || pqrRows.length === 0) {
			await connection.query("INSERT INTO pqr (usuario_id, tipo_pqr, estado, consecutivo, fecha, nombre, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)", [2, "peticion", "radicad", "PQR-1001", new Date(), "Consulta sobre entrega", "Quisiera saber fecha de entrega de mi lote."]);
			console.log("PQRs de ejemplo insertados.");
		} else {
			console.log("La tabla pqr ya tiene datos. No se insertaron ejemplos.");
		}

		// Insertar lotes de ejemplo
		const lotesData = [
			[1, 1, "Lote Palma Norte 1", "2025-06-15", 12, "1,2"],
			[1, 1, "Lote Palma Norte 2", "2025-07-20", 10, "3"],
			[2, 1, "Lote Brisas 1", "2025-08-10", 8, ""],
			[2, 2, "Lote Horizonte 1", "2025-09-05", 15, "4,5"],
		];
		for (const lote of lotesData) {
			await connection.query("INSERT INTO user_lotes (user_id, project_id, lote_name, fecha_compra, numero_cuotas, pagos_ids) VALUES (?, ?, ?, ?, ?, ?)", lote);
		}
		console.log("Lotes de ejemplo insertados.");

		await connection.end();
		process.exit(0);
	} catch (err) {
		console.error("Error creando la base de datos o tablas:", err.message || err);
		process.exit(1);
	}
})();
