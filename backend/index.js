require("dotenv").config();
const express = require("express");
const path = require("path");
const pool = require("./db/connection");

const app = express();
const port = process.env.PORT || 3000;

// Permitir JSON en body
app.use(express.json());

// Servir archivos estáticos desde la carpeta frontend
const staticPath = path.join(__dirname, "", "frontend");
app.use(express.static(staticPath));

// Ruta principal: enviar index.html
app.get("/", (req, res) => {
	res.sendFile(path.join(staticPath, "index.html"));
});

// Ruta API de ejemplo (mantengo la comprobación de BD en /api)
app.get("/api", async (req, res) => {
	try {
		const [rows] = await pool.query("SELECT 1 + 1 AS result");
		res.json({ message: "API funcionando", db: rows[0] });
	} catch (err) {
		console.error("DB error:", err.message || err);
		res.status(500).json({ error: "Error de conexión a la base de datos" });
	}
});

// Endpoint para obtener proyectos
app.get("/api/projects", async (req, res) => {
	try {
		const [rows] = await pool.query("SELECT id, img, nombre, descripcion, largo, ancho, precio, ubicacion, banos, habitaciones, comedor, sala, cocina, cantidad_disponible, etapa, estado FROM projects ORDER BY id DESC");
		res.json({ success: true, projects: rows });
	} catch (err) {
		console.error("Projects error:", err.message || err);
		res.status(500).json({ success: false, message: "Error al obtener proyectos" });
	}
});

// PQR endpoints
// Obtener PQRs, opcionalmente filtradas por usuario: /api/pqrs?userId=2
app.get("/api/pqrs", async (req, res) => {
	const userId = req.query.userId ? Number(req.query.userId) : null;
	try {
		let rows;
		if (userId) {
			[rows] = await pool.query("SELECT * FROM pqr WHERE usuario_id = ? ORDER BY fecha DESC", [userId]);
		} else {
			[rows] = await pool.query("SELECT * FROM pqr ORDER BY fecha DESC");
		}
		res.json({ success: true, pqrs: rows });
	} catch (err) {
		console.error("PQRs error:", err.message || err);
		res.status(500).json({ success: false, message: "Error al obtener PQRs" });
	}
});

// Crear nueva PQR
app.post("/api/pqrs", async (req, res) => {
	const { usuario_id, tipo_pqr, nombre, descripcion } = req.body || {};
	if (!usuario_id || !tipo_pqr || !nombre) return res.status(400).json({ success: false, message: "Faltan campos requeridos" });
	try {
		const consecutivo = "PQR-" + Date.now();
		const fecha = new Date();
		const estado = "radicad";
		const sql = "INSERT INTO pqr (usuario_id, tipo_pqr, estado, consecutivo, fecha, nombre, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)";
		const [result] = await pool.query(sql, [usuario_id, tipo_pqr, estado, consecutivo, fecha, nombre, descripcion]);
		res.json({ success: true, id: result.insertId, consecutivo });
	} catch (err) {
		console.error("Create PQR error:", err.message || err);
		res.status(500).json({ success: false, message: "Error creando PQR" });
	}
});

// Obtener un proyecto por id
app.get("/api/projects/:id", async (req, res) => {
	const id = Number(req.params.id || 0);
	if (!id) return res.status(400).json({ success: false, message: "ID inválido" });
	try {
		const [rows] = await pool.query("SELECT id, img, nombre, descripcion, largo, ancho, precio, ubicacion, banos, habitaciones, comedor, sala, cocina, cantidad_disponible, etapa, estado FROM projects WHERE id = ?", [id]);
		if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
		res.json({ success: true, project: rows[0] });
	} catch (err) {
		console.error("Get project error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

// Actualizar proyecto por id
app.put("/api/projects/:id", async (req, res) => {
	const id = Number(req.params.id || 0);
	if (!id) return res.status(400).json({ success: false, message: "ID inválido" });
	const allowed = ["img", "nombre", "descripcion", "largo", "ancho", "precio", "ubicacion", "banos", "habitaciones", "comedor", "sala", "cocina", "cantidad_disponible", "etapa", "estado"];
	const updates = [];
	const values = [];
	for (const key of allowed) {
		if (Object.prototype.hasOwnProperty.call(req.body, key)) {
			updates.push(`${key} = ?`);
			values.push(req.body[key]);
		}
	}
	if (updates.length === 0) return res.status(400).json({ success: false, message: "No hay campos para actualizar" });
	values.push(id);
	const sql = `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`;
	try {
		await pool.query(sql, values);
		res.json({ success: true, message: "Proyecto actualizado" });
	} catch (err) {
		console.error("Update project error:", err.message || err);
		res.status(500).json({ success: false, message: "Error al actualizar proyecto" });
	}
});

// Crear nuevo proyecto
app.post("/api/projects", async (req, res) => {
	const allowed = ["img", "nombre", "descripcion", "largo", "ancho", "precio", "ubicacion", "banos", "habitaciones", "comedor", "sala", "cocina", "cantidad_disponible", "etapa", "estado"];
	const cols = [];
	const vals = [];
	const placeholders = [];
	for (const key of allowed) {
		if (Object.prototype.hasOwnProperty.call(req.body, key)) {
			cols.push(key);
			placeholders.push("?");
			vals.push(req.body[key]);
		}
	}
	if (cols.length === 0) return res.status(400).json({ success: false, message: "No hay datos para crear" });

	try {
		const sql = `INSERT INTO projects (${cols.join(",")}) VALUES (${placeholders.join(",")})`;
		const [result] = await pool.query(sql, vals);
		res.json({ success: true, id: result.insertId });
	} catch (err) {
		console.error("Create project error:", err.message || err);
		res.status(500).json({ success: false, message: "Error creando proyecto" });
	}
});

// Endpoint de login: recibe { email, password }
app.post("/api/login", async (req, res) => {
	const { email, password } = req.body || {};
	if (!email || !password) return res.status(400).json({ success: false, message: "Faltan credenciales" });

	try {
		const [rows] = await pool.query("SELECT id, email, password FROM users WHERE email = ?", [email]);
		if (!rows || rows.length === 0) return res.json({ success: false, message: "Credenciales inválidas" });

		const user = rows[0];
		const bcrypt = require("bcrypt");
		const match = await bcrypt.compare(password, user.password);
		if (!match) return res.json({ success: false, message: "Credenciales inválidas" });

		// Login successful
		res.json({ success: true, message: "Autenticación correcta", userId: user.id });
	} catch (err) {
		console.error("Login error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

// Endpoint de registro: recibe { name, username, email, password }
app.post("/api/register", async (req, res) => {
	const { name, username, email, password } = req.body || {};
	if (!name || !username || !email || !password) return res.status(400).json({ success: false, message: "Todos los campos son requeridos" });

	try {
		const bcrypt = require("bcrypt");
		const saltRounds = 10;
		const hash = await bcrypt.hash(password, saltRounds);

		await pool.query("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)", [name, username, email, hash]);
		res.json({ success: true, message: "Usuario registrado correctamente" });
	} catch (err) {
		console.error("Register error:", err.message || err);
		if (err.code === "ER_DUP_ENTRY") {
			res.status(400).json({ success: false, message: "El usuario o email ya existe" });
		} else {
			res.status(500).json({ success: false, message: "Error del servidor" });
		}
	}
});

// Endpoint para obtener info del usuario: GET /api/user?userId=...
app.get("/api/user", async (req, res) => {
	const { userId } = req.query;
	if (!userId) return res.status(400).json({ success: false, message: "userId requerido" });

	try {
		const [rows] = await pool.query("SELECT id, name, username, email, role, created_at FROM users WHERE id = ?", [userId]);
		if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

		res.json({ success: true, user: rows[0] });
	} catch (err) {
		console.error("Get user error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

// Endpoint para actualizar usuario: PUT /api/user
app.put("/api/user", async (req, res) => {
	const { userId, name, username, email } = req.body || {};
	if (!userId || !name || !username || !email) return res.status(400).json({ success: false, message: "Todos los campos son requeridos" });

	try {
		await pool.query("UPDATE users SET name = ?, username = ?, email = ? WHERE id = ?", [name, username, email, userId]);
		res.json({ success: true, message: "Usuario actualizado correctamente" });
	} catch (err) {
		console.error("Update user error:", err.message || err);
		if (err.code === "ER_DUP_ENTRY") {
			res.status(400).json({ success: false, message: "El username o email ya existe" });
		} else {
			res.status(500).json({ success: false, message: "Error del servidor" });
		}
	}
});

// Endpoint para obtener pagos del usuario: GET /api/payments?userId=...
app.get("/api/payments", async (req, res) => {
	const { userId } = req.query;
	if (!userId) return res.status(400).json({ success: false, message: "userId requerido" });

	try {
		const [rows] = await pool.query("SELECT * FROM payments WHERE user_id = ? ORDER BY fecha_pago DESC", [userId]);
		res.json({ success: true, payments: rows });
	} catch (err) {
		console.error("Get payments error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

// Endpoint para registrar pago: POST /api/payments
app.post("/api/payments", async (req, res) => {
	const { userId, projectId, loteId, valor, cuotasNro, fechaPago, totalCuotas, intereses, aporteCapital } = req.body || {};
	if (!userId || !projectId || !loteId || !valor || !cuotasNro || !fechaPago || !totalCuotas) return res.status(400).json({ success: false, message: "Todos los campos requeridos son necesarios" });

	try {
		const [paymentResult] = await pool.query("INSERT INTO payments (user_id, project_id, valor, cuotas_nro, fecha_pago, total_cuotas, intereses, aporte_capital) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [userId, projectId, valor, cuotasNro, fechaPago, totalCuotas, intereses || 0, aporteCapital || 0]);

		// Normalize insert id between mysql2 result and libsql result
		let paymentId = null;
		if (paymentResult && typeof paymentResult.insertId !== 'undefined') {
			paymentId = paymentResult.insertId;
		} else {
			const [payIdRows] = await pool.query("SELECT last_insert_rowid() AS id");
			if (payIdRows && payIdRows[0] && typeof payIdRows[0].id !== 'undefined') paymentId = payIdRows[0].id;
		}

		console.log(`Registered paymentId=${paymentId} for user=${userId} project=${projectId} lote=${loteId} valor=${valor}`);

		// Actualizar user_lotes: leer pagos_ids, añadir paymentId y recalcular valor_restante a partir de pagos
		try {
			const [loteRows] = await pool.query("SELECT pagos_ids, valor_total FROM user_lotes WHERE id = ?", [loteId]);
			let pagos = [];
			let valorTotalLote = null;
			if (loteRows && loteRows[0]) {
				valorTotalLote = loteRows[0].valor_total;
				if (loteRows[0].pagos_ids) {
					try {
						pagos = JSON.parse(loteRows[0].pagos_ids);
						if (!Array.isArray(pagos)) pagos = [];
					} catch (e) {
						pagos = [];
					}
				}
			}
			pagos.push(paymentId);

			// Obtener pagos reales desde la tabla payments para sumar aporte_capital
			let totalPagado = 0;
			if (pagos.length > 0) {
				const placeholders = pagos.map(() => '?').join(',');
				const [payRows] = await pool.query(`SELECT aporte_capital FROM payments WHERE id IN (${placeholders})`, pagos);
				for (const pr of payRows) {
					totalPagado += Number(pr.aporte_capital || 0);
				}
			}

			const valorRestante = (typeof valorTotalLote === 'number' ? valorTotalLote : Number(valorTotalLote || 0)) - totalPagado;
			const remaining = valorRestante > 0 ? valorRestante : 0;

			await pool.query("UPDATE user_lotes SET pagos_ids = ?, valor_restante = ? WHERE id = ?", [JSON.stringify(pagos), remaining, loteId]);
		} catch (e) {
			console.error('Error actualizando user_lotes pagos_ids:', e && e.message ? e.message : e);
		}

		res.json({ success: true, message: "Pago registrado correctamente" });
	} catch (err) {
		console.error("Register payment error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

// Endpoint para obtener lotes del usuario: GET /api/user-lotes?userId=...
app.get("/api/user-lotes", async (req, res) => {
	const { userId } = req.query;
	if (!userId) return res.status(400).json({ success: false, message: "userId requerido" });

	try {
		// By default, exclude fully paid lots. Pass includePaid=true to include them.
		const includePaid = req.query.includePaid === 'true';
		let rows;
		if (includePaid) {
			[rows] = await pool.query("SELECT * FROM user_lotes WHERE user_id = ? ORDER BY fecha_compra DESC", [userId]);
		} else {
			[rows] = await pool.query("SELECT * FROM user_lotes WHERE user_id = ? AND (valor_restante IS NULL OR valor_restante > 0) ORDER BY fecha_compra DESC", [userId]);
		}

		// Augment each lote with computed totals: pagos_count, total_pagado, valor_restante_computed, paid boolean
		const augmented = [];
		for (const lote of rows) {
			let pagos = [];
			if (lote.pagos_ids) {
				try {
					pagos = JSON.parse(lote.pagos_ids);
					if (!Array.isArray(pagos)) pagos = [];
				} catch (e) {
					pagos = [];
				}
			}

			let totalPagado = 0;
			if (pagos.length > 0) {
				const placeholders = pagos.map(() => '?').join(',');
				const [payRows] = await pool.query(`SELECT aporte_capital FROM payments WHERE id IN (${placeholders})`, pagos);
				for (const pr of payRows) totalPagado += Number(pr.aporte_capital || 0);
			}

			const valorTotal = Number(lote.valor_total || 0);
			const valorRestanteComputed = Math.max(0, valorTotal - totalPagado);
			const paid = valorRestanteComputed <= 0;

			augmented.push({ ...lote, pagos_count: pagos.length, total_pagado: totalPagado, valor_restante_computed: valorRestanteComputed, paid });
		}

		res.json({ success: true, lotes: augmented });
	} catch (err) {
		console.error("Get user-lotes error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

// Endpoint para comprar proyecto: POST /api/buy-project
app.post("/api/buy-project", async (req, res) => {
	const { userId, projectId, cuotas, valorCuota, valorTotal } = req.body || {};
	if (!userId || !projectId || !cuotas || !valorCuota || !valorTotal) return res.status(400).json({ success: false, message: "Todos los campos requeridos son necesarios" });

	try {
		// Obtener nombre del proyecto
		const [projectRows] = await pool.query("SELECT nombre FROM projects WHERE id = ?", [projectId]);
		if (!projectRows || projectRows.length === 0) return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
		const loteName = projectRows[0].nombre;

		// Insertar en user_lotes (incluyendo numero_cuotas y un pagos_ids vacío como JSON string)
		const fechaCompra = new Date().toISOString().split("T")[0];
		const [insertResult] = await pool.query("INSERT INTO user_lotes (user_id, project_id, lote_name, fecha_compra, numero_cuotas, pagos_ids, valor_total, cuotas_total, valor_cuota, valor_restante) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [userId, projectId, loteName, fechaCompra, cuotas, JSON.stringify([]), valorTotal, cuotas, valorCuota, valorTotal]);

		// Normalize insert id between mysql2 result and libsql result
		let userLoteId = null;
		if (insertResult && typeof insertResult.insertId !== "undefined") {
			userLoteId = insertResult.insertId;
		} else {
			const [idRows] = await pool.query("SELECT last_insert_rowid() AS id");
			if (idRows && idRows[0] && typeof idRows[0].id !== "undefined") userLoteId = idRows[0].id;
		}

		// Calcular intereses y aporte para el primer pago
		const intereses = valorCuota * 0.12;
		const aporteCapital = valorCuota - intereses;
		const fechaPago = new Date().toISOString().split("T")[0];

		// Insertar primer pago
		const [paymentResult] = await pool.query("INSERT INTO payments (user_id, project_id, valor, cuotas_nro, fecha_pago, total_cuotas, intereses, aporte_capital) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [userId, projectId, valorCuota, 1, fechaPago, cuotas, intereses, aporteCapital]);

		let paymentId = null;
		if (paymentResult && typeof paymentResult.insertId !== "undefined") {
			paymentId = paymentResult.insertId;
		} else {
			const [payIdRows] = await pool.query("SELECT last_insert_rowid() AS id");
			if (payIdRows && payIdRows[0] && typeof payIdRows[0].id !== "undefined") paymentId = payIdRows[0].id;
		}

		// Actualizar user_lotes con pagos_ids (esquema Turso/SQLite almacena JSON como texto)
		// Recalculate valor_restante based on payments (include the first payment)
		try {
			const pagos = [paymentId];
			let totalPagado = 0;
			if (pagos.length > 0) {
				const placeholders = pagos.map(() => '?').join(',');
				const [payRows] = await pool.query(`SELECT aporte_capital FROM payments WHERE id IN (${placeholders})`, pagos);
				for (const pr of payRows) totalPagado += Number(pr.aporte_capital || 0);
			}
			const valorTotalNum = Number(valorTotal || 0);
			const remaining = Math.max(0, valorTotalNum - totalPagado);
			await pool.query("UPDATE user_lotes SET pagos_ids = ?, valor_restante = ? WHERE id = ?", [JSON.stringify(pagos), remaining, userLoteId]);
		} catch (e) {
			console.error('Error actualizando valor_restante tras compra:', e && e.message ? e.message : e);
		}

		res.json({ success: true, message: "Compra realizada correctamente" });
	} catch (err) {
		console.error("Buy project error:", err.message || err);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
