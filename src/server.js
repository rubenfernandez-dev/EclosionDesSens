const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET no está definido. Configúralo en las variables de entorno antes de iniciar el servidor.');
}

app.set("trust proxy", 1);
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: process.env.SESSION_NAME || 'eds.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 4 // 4 horas
  }
}));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Servir favicon desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// ========================================
// RUTAS LIMPIAS PARA PANEL ADMIN
// ========================================
// /admin → redirige a /admin/dashboard
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// /admin/login → sirve login.html
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// /admin/dashboard → sirve dashboard.html (con verificación de sesión)
app.get('/admin/dashboard', (req, res) => {
  // Nota: La verificación de sesión se realiza en el lado del cliente con JavaScript
  // o en las rutas /api/admin si necesitas protección en backend
  res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});

// Importar rutas
const reservasRoutes = require('./routes/reservas');
const contactoRoutes = require('./routes/contacto');
const adminRoutes = require('./routes/admin');

// Usar rutas
app.use('/api/reservas', reservasRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/admin', adminRoutes);

// Ruta principal - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

// Iniciar servidor
async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_DEFAULT_USER;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!username || !password) {
    console.warn('⚠️ ADMIN_DEFAULT_USER o ADMIN_DEFAULT_PASSWORD no definidos. Crea al menos un usuario admin.');
    return;
  }

  const [rows] = await db.execute('SELECT id FROM admin_users WHERE username = ? LIMIT 1', [username]);
  if (rows.length) return;

  const hash = await bcrypt.hash(password, 10);
  await db.execute('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, 'admin']);
  console.log(`✅ Usuario admin creado: ${username}`);
}

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🌿 Éclosion des sens - Servidor activo  ║
║   🌐 Puerto: ${PORT}                         ║
║   📍 http://localhost:${PORT}                ║
╚══════════════════════════════════════════╝
  `);

  ensureDefaultAdmin().catch((err) => {
    console.error('❌ No se pudo crear el admin por defecto:', err.message);
  });
});

module.exports = app;
