const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./config/db');

const app = express();
app.disable('x-powered-by');

const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    'SESSION_SECRET no está definido. Configúralo en las variables de entorno antes de iniciar el servidor.'
  );
}

app.set('trust proxy', 1);

// ========================================
// SESIONES PERSISTENTES EN MYSQL
// ========================================

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 4 * 60 * 60 * 1000
});

// ========================================
// MIDDLEWARES
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: process.env.SESSION_NAME || 'eds.sid',
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 4 // 4 horas
    }
  })
);

// ========================================
// PROTECCIÓN SERVER-SIDE DEL PANEL ADMIN
// ========================================

app.use('/admin', (req, res, next) => {
  // El login debe permanecer accesible sin sesión.
  if (req.path === '/login' || req.path === '/login.html') {
    return next();
  }

  // Evita que páginas protegidas del Admin queden cacheadas.
  res.set('Cache-Control', 'no-store');

  if (req.session && req.session.user) {
    return next();
  }

  return res.redirect('/admin/login');
});

// ========================================
// RUTAS DEL PANEL ADMIN
// ========================================

// /admin → dashboard
// Si no existe sesión, el middleware anterior redirige al login.
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Login
app.get('/admin/login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Compatibilidad con la URL física anterior
app.get('/admin/login.html', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Dashboard protegido
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});

// Impide saltarse la protección entrando directamente al HTML
app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});

// ========================================
// ARCHIVOS ESTÁTICOS
// IMPORTANTE: después de la protección /admin
// ========================================

app.use(express.static(path.join(__dirname, 'public')));


// ========================================
// IMPORTAR RUTAS API
// ========================================

const reservasRoutes = require('./routes/reservas');
const contactoRoutes = require('./routes/contacto');
const adminRoutes = require('./routes/admin');

// ========================================
// USAR RUTAS API
// ========================================

app.use('/api/reservas', reservasRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/admin', adminRoutes);

// ========================================
// RUTA PRINCIPAL
// ========================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// ========================================
// MANEJO GENERAL DE ERRORES
// ========================================

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// ========================================
// ADMIN POR DEFECTO
// ========================================

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_DEFAULT_USER;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!username || !password) {
    console.warn(
      '⚠️ ADMIN_DEFAULT_USER o ADMIN_DEFAULT_PASSWORD no definidos. Crea al menos un usuario admin.'
    );
    return;
  }

  const [rows] = await db.execute(
    'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
    [username]
  );

  if (rows.length) return;

  const hash = await bcrypt.hash(password, 10);

  await db.execute(
    'INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)',
    [username, hash, 'admin']
  );

  console.log(`✅ Usuario admin creado: ${username}`);
}

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🌿 Éclosion des sens - Servidor activo  ║
║   🌐 Puerto: ${PORT}                         ║
║   📍 http://localhost:${PORT}                ║
╚══════════════════════════════════════════╝
  `);

  ensureDefaultAdmin().catch((err) => {
    console.error(
      '❌ No se pudo crear el admin por defecto:',
      err.message
    );
  });
});

module.exports = app;
