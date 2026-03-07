-- SQL: creación y configuración de la base de datos "constructora_malambo"
-- Uso: ejecutar este archivo en MySQL (por ejemplo: mysql -u root -p < constructora_malambo.sql)

-- 1) Crear la base de datos con codificación utf8mb4
CREATE DATABASE IF NOT EXISTS `constructora_malambo`
	CHARACTER SET = utf8mb4
	COLLATE = utf8mb4_unicode_ci;

-- 2) (Opcional) Crear un usuario dedicado y otorgar permisos
-- Cambia 'CHANGE_ME' por una contraseña segura antes de usar en producción
CREATE USER IF NOT EXISTS 'constructora_user'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON `constructora_malambo`.* TO 'constructora_user'@'localhost';
FLUSH PRIVILEGES;

-- 3) Usar la base de datos
USE `constructora_malambo`;

-- 4) Tablas principales (esquema inicial)

-- Usuarios (para autenticación y roles)
CREATE TABLE IF NOT EXISTS `users` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(150) NOT NULL,
	`email` VARCHAR(255) NOT NULL UNIQUE,
	`password` VARCHAR(255) NOT NULL,
	`role` VARCHAR(50) NOT NULL DEFAULT 'user',
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clientes
CREATE TABLE IF NOT EXISTS `clients` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(200) NOT NULL,
	`contact` VARCHAR(150),
	`phone` VARCHAR(50),
	`email` VARCHAR(255),
	`address` TEXT,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Proyectos
CREATE TABLE IF NOT EXISTS `projects` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
	`client_id` BIGINT UNSIGNED,
	`start_date` DATE,
	`end_date` DATE,
	`status` VARCHAR(50) DEFAULT 'planning',
	`budget` DECIMAL(15,2) DEFAULT 0.00,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	KEY (`client_id`),
	CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Empleados
CREATE TABLE IF NOT EXISTS `employees` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(200) NOT NULL,
	`role` VARCHAR(100),
	`phone` VARCHAR(50),
	`email` VARCHAR(255),
	`hired_date` DATE,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Materiales
CREATE TABLE IF NOT EXISTS `materials` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
	`unit` VARCHAR(50),
	`price` DECIMAL(12,2) DEFAULT 0.00,
	`stock` DECIMAL(12,3) DEFAULT 0.000,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contratos (empleados asignados a proyectos)
CREATE TABLE IF NOT EXISTS `contracts` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`project_id` BIGINT UNSIGNED,
	`employee_id` BIGINT UNSIGNED,
	`role` VARCHAR(100),
	`start_date` DATE,
	`end_date` DATE,
	`salary` DECIMAL(12,2) DEFAULT 0.00,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	KEY (`project_id`),
	KEY (`employee_id`),
	CONSTRAINT `fk_contracts_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_contracts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices y consideraciones adicionales se pueden añadir aquí según las necesidades.

-- Fin del script

