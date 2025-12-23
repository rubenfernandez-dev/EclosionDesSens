-- ========================================
-- ÉCLOSION DES SENS - BASE DE DATOS
-- Script SQL para MySQL
-- ========================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS clinica_masajes 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE clinica_masajes;

-- ========================================
-- TABLA: reservas
-- Almacena todas las reservas de masajes
-- ========================================
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único de la reserva',
  nombre VARCHAR(100) NOT NULL COMMENT 'Nombre completo del cliente',
  telefono VARCHAR(20) NOT NULL COMMENT 'Teléfono de contacto',
  email VARCHAR(100) NOT NULL COMMENT 'Email del cliente',
  fecha_reserva DATE NOT NULL COMMENT 'Fecha de la reserva',
  hora_reserva TIME NOT NULL COMMENT 'Hora de la reserva',
  tipo_masaje VARCHAR(100) NOT NULL COMMENT 'Tipo de masaje seleccionado',
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' COMMENT 'Estado de la reserva',
  notas TEXT COMMENT 'Notas internas del staff',
  mensaje TEXT COMMENT 'Mensaje o solicitud especial (opcional)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  
  -- Índices para mejorar rendimiento
  INDEX idx_fecha_reserva (fecha_reserva),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de reservas de masajes';

-- ========================================
-- TABLA: disponibilidad
-- Almacena slots disponibles por día y hora
-- ========================================
CREATE TABLE IF NOT EXISTS disponibilidad (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID del slot',
  dia_semana TINYINT NOT NULL COMMENT '0=Domingo ... 6=Sábado',
  hora TIME NOT NULL COMMENT 'Hora disponible (HH:MM:SS)',
  disponible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 disponible, 0 no disponible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_dia_hora (dia_semana, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Disponibilidad de días y horas';

-- ========================================
-- TABLA: admin_users
-- Usuarios del panel de administración
-- ========================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuarios del panel admin';

-- ========================================
-- TABLA: contactos
-- Almacena mensajes del formulario de contacto
-- ========================================
CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único del mensaje',
  nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de la persona',
  email VARCHAR(100) NOT NULL COMMENT 'Email de contacto',
  mensaje TEXT NOT NULL COMMENT 'Mensaje del contacto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de recepción del mensaje',
  
  -- Índices para mejorar rendimiento
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de mensajes de contacto';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Mostrar las tablas creadas
SHOW TABLES;

-- Mostrar estructura de la tabla reservas
DESCRIBE reservas;

-- Mostrar estructura de la tabla contactos
DESCRIBE contactos;

-- ========================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- Descomenta las siguientes líneas para insertar datos de prueba
-- ========================================

/*
-- Insertar reserva de ejemplo
INSERT INTO reservas (nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje)
VALUES 
('Juan Pérez', '+41 76 123 45 67', 'juan@ejemplo.com', '2024-12-25', '14:00:00', 'Masaje Relajante (60 min)', 'Primera vez, me gustaría recibir información adicional');

-- Insertar mensaje de contacto de ejemplo
INSERT INTO contactos (nombre, email, mensaje)
VALUES 
('María González', 'maria@ejemplo.com', 'Hola, me gustaría conocer más sobre los servicios que ofrecen. ¿Tienen disponibilidad para el fin de semana?');

-- Verificar datos insertados
SELECT * FROM reservas;
SELECT * FROM contactos;
*/

-- ========================================
-- CONSULTAS ÚTILES
-- ========================================

-- Ver todas las reservas ordenadas por fecha
-- SELECT * FROM reservas ORDER BY fecha_reserva DESC, hora_reserva DESC;

-- Ver reservas de hoy
-- SELECT * FROM reservas WHERE DATE(fecha_reserva) = CURDATE();

-- Ver reservas futuras
-- SELECT * FROM reservas WHERE fecha_reserva >= CURDATE() ORDER BY fecha_reserva, hora_reserva;

-- Contar reservas por tipo de masaje
-- SELECT tipo_masaje, COUNT(*) as total FROM reservas GROUP BY tipo_masaje;

-- Ver últimos mensajes de contacto
-- SELECT * FROM contactos ORDER BY created_at DESC LIMIT 10;

-- Buscar reserva por email
-- SELECT * FROM reservas WHERE email = 'cliente@ejemplo.com';

-- ========================================
-- MANTENIMIENTO
-- ========================================

-- Eliminar reservas antiguas (más de 1 año)
-- DELETE FROM reservas WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Eliminar contactos antiguos (más de 1 año)
-- DELETE FROM contactos WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ========================================
-- BACKUP
-- ========================================

-- Para hacer backup de la base de datos, ejecuta desde la terminal:
-- mysqldump -u usuario -p clinica_masajes > backup_clinica_masajes_$(date +%Y%m%d).sql

-- Para restaurar un backup:
-- mysql -u usuario -p clinica_masajes < backup_clinica_masajes_20241222.sql

-- ========================================
-- USUARIO DE BASE DE DATOS (Opcional)
-- ========================================

-- Crear un usuario específico para la aplicación (recomendado para producción)
/*
CREATE USER 'eclosion_user'@'localhost' IDENTIFIED BY 'contraseña_segura_aqui';
GRANT SELECT, INSERT, UPDATE, DELETE ON clinica_masajes.* TO 'eclosion_user'@'localhost';
FLUSH PRIVILEGES;
*/

-- Para verificar los permisos:
-- SHOW GRANTS FOR 'eclosion_user'@'localhost';

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

SELECT '✅ Base de datos configurada correctamente' AS Resultado;
SELECT COUNT(*) AS 'Tablas creadas' FROM information_schema.tables WHERE table_schema = 'clinica_masajes';
