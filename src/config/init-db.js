const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_ROOT_USER || 'root',
  password: process.env.DB_ROOT_PASSWORD || '',
  multipleStatements: true
});

connection.connect((err) => {
  if (err) {
    console.error('❌ No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');

  // Primero, eliminar la BD si existe
  connection.query('DROP DATABASE IF EXISTS clinica_masajes', (err) => {
    if (err) {
      console.error('⚠️ Aviso al eliminar BD anterior:', err.message);
    } else {
      console.log('✅ Base de datos anterior eliminada');
    }

    // Ahora ejecutar el script SQL
    const sqlPath = path.join(__dirname, '../../database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    connection.query(sql, (err) => {
      if (err) {
        console.error('❌ Error al ejecutar database.sql:', err.message);
        connection.end();
        process.exit(1);
      }
      console.log('✅ Base de datos inicializada correctamente');
      connection.end();
      process.exit(0);
    });
  });
});
