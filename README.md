# Constructora Malambo — Manual de usuario

Este repositorio contiene el backend (Node.js + Express) y el frontend estático de la aplicación "Constructora Malambo". A continuación encontrarás instrucciones para instalar, ejecutar y usar la aplicación, así como los detalles de la funcionalidad de administración de PQR.

## Requisitos

- Node.js >= 18
- npm
- Cuenta y base de datos Turso (se usa `@libsql/client`)

## Variables de entorno

Coloca un fichero `.env` en `backend/` o configura variables en Vercel con las siguientes claves:

- `TURSO_DATABASE_URL` — URL de conexión a la base de datos Turso (ej: `libsql://...`).
- `TURSO_AUTH_TOKEN` — Token de autorización para la base de datos Turso (si aplica).

Si `TURSO_DATABASE_URL` no está presente, el backend fallará con un error indicando que falta la configuración.

## Ejecutar localmente

1. En la carpeta `backend/` instala dependencias:

```bash
npm install
```

2. Ejecuta el servidor en modo desarrollo:

```bash
npm run dev
```

3. Abre el frontend en `http://localhost:3000` (o la URL que muestre el servidor).

## Migración de esquema (añadir `respuesta` a PQR en Turso)

Si tu base en Turso aún no tiene la columna `respuesta` en la tabla `pqr`, conéctate a Turso y ejecuta:

```sql
ALTER TABLE pqr ADD COLUMN respuesta TEXT;
```

El archivo `mysql/db_schema_turso.sql` incluido contiene el esquema actualizado con la columna `respuesta`.

## Endpoints principales (resumen)

- `GET /api/projects` — Obtener proyectos.
- `POST /api/projects` — Crear proyecto.
- `PUT /api/projects/:id` — Actualizar proyecto.
- `POST /api/buy-project` — Registrar la compra de un lote.
- `GET /api/user-lotes?userId=...` — Obtener lotes de un usuario.
- `GET /api/payments?userId=...` — Obtener pagos de un usuario.
- `POST /api/payments` — Registrar un pago.
- `GET /api/pqrs` — Listar PQRs.
- `POST /api/pqrs` — Crear PQR.
- `PUT /api/pqrs/:id` — Actualizar `respuesta` y/o `estado` de una PQR.
- `GET /api/user?userId=...` — Obtener datos de un usuario (incluye `role`).

> Nota: actualmente los endpoints no están restringidos en el backend (según configuración actual). La interfaz oculta botones/entradas para usuarios que no son `admin`, pero si deseas reforzar seguridad, es recomendable validar `role` en servidor antes de permitir cambios críticos.

## Frontend — páginas relevantes

- `dashboard.html` — Página principal; muestra proyectos. Un enlace adicional `Gestionar PQR` aparece solo para usuarios con `role === "admin"`.
- `project-create.html` / `project-edit.html` — Creación y edición de proyectos (la UI redirige si el usuario no es admin).
- `pqr-manage.html` — Página creada para administradores: lista PQRs, permite editar `respuesta` y cambiar `estado`.
- `payments.html`, `register-payment.html`, `lots.html`, etc. — Gestión de pagos y lotes.

## Cómo usar la funcionalidad de PQR (administrador)

1. Inicia sesión con un usuario admin (almacenado como `userId` en `localStorage` por la UI de login).
2. En `dashboard.html` verás el enlace `Gestionar PQR` (solo visible para admin).
3. En `pqr-manage.html` puedes:
    - Leer las PQRs existentes.
    - Escribir una `respuesta` (campo de texto) y pulsar "Guardar respuesta" — esto llama a `PUT /api/pqrs/:id` con `{ respuesta }`.
    - Marcar la PQR como `respondida` usando el botón correspondiente (también via `PUT`).

## Crear un usuario admin (SQL)

Si necesitas crear un admin directamente en la base de datos, ejecuta (ajusta valores):

```sql
INSERT INTO users (name, username, email, password, role) VALUES ('Admin','admin','admin@example.com','<hashed_password>','admin');
```

Nota: las contraseñas en la aplicación se almacenan con `bcrypt` — si insertas manualmente, debes guardar el hash generado por `bcrypt`.

## Problemas comunes

- Error "TURSO_DATABASE_URL is not set": configura la variable de entorno mencionada.
- "connect ECONNREFUSED 127.0.0.1:3306": significa que el servicio intentó usar MySQL local — la aplicación ahora usa Turso; asegúrate de tener `TURSO_DATABASE_URL` configurada en Vercel o en `.env` local.

## Despliegue en Vercel

- Añade `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en la sección de Environment Variables de tu proyecto en Vercel.
- Si usas Turso, no debes configurar MySQL en Vercel.

## Contacto / Soporte

Si encuentras errores en UI o en endpoints, pega el mensaje exacto de la consola (navegador o servidor) y la ruta/archivo implicado para que lo pueda corregir.

---

© Constructora Malambo
