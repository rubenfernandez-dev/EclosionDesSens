const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mismo motivo que en reservasRoutes.test.js: no se hace require('../src/routes/admin')
// porque importa src/config/db.js (conexión MySQL real y viva). Se verifica por
// inspección del código fuente.
const codigoFuente = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'routes', 'admin.js'),
  'utf8'
);

test('admin.js no depende de disponibilidad_bloqueada (no existe en producción)', () => {
  assert.doesNotMatch(codigoFuente, /disponibilidad_bloqueada/);
});

test('PATCH /reservas/:id valida el estado contra la whitelist', () => {
  assert.match(codigoFuente, /esEstadoValido\(estado\)/);
});

test('PATCH /reservas/:id bloquea disponibilidad y reservas dentro de una transacción al restaurar', () => {
  assert.match(codigoFuente, /beginTransaction/);
  assert.match(codigoFuente, /FROM disponibilidad WHERE hora = \? AND[\s\S]*FOR UPDATE/);
  assert.match(codigoFuente, /estado != "cancelada" AND id != \?/);
});
