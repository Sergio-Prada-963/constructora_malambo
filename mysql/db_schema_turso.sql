-- Turso/SQLite schema exported from db_schema_turso.txt
PRAGMA foreign_keys = ON;

CREATE TABLE payments (
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

CREATE TABLE pqr (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        tipo_pqr TEXT NOT NULL,
        estado TEXT DEFAULT 'radicad',
        consecutivo TEXT UNIQUE,
        fecha DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        nombre TEXT,
        descripcion TEXT,
  respuesta TEXT,
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        FOREIGN KEY(usuario_id) REFERENCES users(id) ON DELETE SET NULL
      );

CREATE TABLE projects (
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

CREATE TABLE user_lotes (
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

CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
      );
