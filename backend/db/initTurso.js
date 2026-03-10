require("dotenv").config();
const { createClient } = require("@libsql/client");
const bcrypt = require("bcrypt");

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;
if (!TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL not set");
  process.exit(1);
}

const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

(async () => {
  try {
    // Enable foreign keys
    await client.execute("PRAGMA foreign_keys = ON;");

    // Users
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
      );
    `);

    // Projects
    await client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        img TEXT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        largo REAL DEFAULT 0,
        ancho REAL DEFAULT 0,
        precio REAL DEFAULT 0,
        ubicacion TEXT,
        banos INTEGER DEFAULT 0,
        habitaciones INTEGER DEFAULT 0,
        comedor INTEGER DEFAULT 0,
        sala INTEGER DEFAULT 0,
        cocina INTEGER DEFAULT 0,
        cantidad_disponible INTEGER DEFAULT 0,
        etapa TEXT DEFAULT 'planificacion',
        estado TEXT DEFAULT 'disponible',
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
      );
    `);

    // Payments
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        user_id INTEGER NOT NULL,
        valor REAL NOT NULL,
        cuotas_nro INTEGER NOT NULL,
        fecha_pago DATE NOT NULL,
        total_cuotas INTEGER NOT NULL,
        intereses REAL DEFAULT 0.0,
        aporte_capital REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // user_lotes
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_lotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        lote_name TEXT,
        fecha_compra DATE NOT NULL,
        numero_cuotas INTEGER NOT NULL,
        pagos_ids TEXT,
        valor_total REAL DEFAULT 0,
        cuotas_total INTEGER DEFAULT 0,
        valor_cuota REAL DEFAULT 0,
        valor_restante REAL DEFAULT 0,
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // pqr
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pqr (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        tipo_pqr TEXT NOT NULL,
        estado TEXT DEFAULT 'radicad',
        consecutivo TEXT UNIQUE,
        fecha DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        nombre TEXT,
        descripcion TEXT,
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        FOREIGN KEY(usuario_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Insert sample data if not exists
    const adminEmail = "admin@gmail.com";
    const adminPlain = "123";
    const adminRes = await client.execute("SELECT id FROM users WHERE email = ?", [adminEmail]);
    const existingAdmins = adminRes && adminRes.rows ? adminRes.rows : [];
    if (!existingAdmins || existingAdmins.length === 0) {
      const hash = await bcrypt.hash(adminPlain, 10);
      await client.execute("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)", ["Administrador", "admin", adminEmail, hash]);
      console.log("Usuario admin creado en Turso.");
    } else {
      console.log("Usuario admin ya existe en Turso.");
    }

    console.log("Esquema en Turso creado/asegurado.");
    process.exit(0);
  } catch (err) {
    console.error("Error inicializando Turso:", err.message || err);
    process.exit(1);
  }
})();
