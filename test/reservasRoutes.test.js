const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Nota: no se hace require('../src/routes/reservas') porque ese módulo importa
// src/config/db.js, que abre una conexión MySQL real y viva (referenciada) al
// cargarse, y src/config/mailer.js, que verifica el transporter SMTP real.
// Eso hace que el proceso de test cuelgue esperando esas conexiones/handles
// en lugar de terminar. Verificamos el contrato de rutas por inspección del
// código fuente, sin tocar infraestructura real.
const codigoFuente = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'routes', 'reservas.js'),
  'utf8'
);

test('el router público de reservas ya no expone DELETE /:id', () => {
  assert.doesNotMatch(codigoFuente, /router\.delete\s*\(/);
});

test('el router público conserva POST / y GET /disponibilidad/:fecha', () => {
  assert.match(codigoFuente, /router\.post\(\s*'\/'/);
  assert.match(codigoFuente, /router\.get\(\s*'\/disponibilidad\/:fecha'/);
});

test('el router público ya no expone horarios semanales (GET /disponibilidad ni fecha IS NULL)', () => {
  assert.doesNotMatch(codigoFuente, /router\.get\(\s*'\/disponibilidad'\s*,/);
  // Como condición SQL (los comentarios pueden mencionarlo)
  assert.doesNotMatch(codigoFuente, /(WHERE|AND|OR)\s+\(?\s*fecha IS NULL/i);
});

test('reservas.js no depende de disponibilidad_bloqueada (no existe en producción)', () => {
  assert.doesNotMatch(codigoFuente, /(INSERT|SELECT|DELETE)[^;]*disponibilidad_bloqueada/i);
});

test('POST / usa FOR UPDATE sobre disponibilidad dentro de una transacción', () => {
  assert.match(codigoFuente, /beginTransaction/);
  assert.match(codigoFuente, /FROM disponibilidad WHERE fecha = \? AND hora = \? AND disponible = 1 FOR UPDATE/);
});
