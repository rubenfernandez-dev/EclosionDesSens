const test = require('node:test');
const assert = require('node:assert/strict');

const { ESTADOS_VALIDOS, esEstadoValido, bloqueaHueco } = require('../src/utils/estadosReserva');

test('esEstadoValido acepta solo los estados usados por el panel admin', () => {
  for (const estado of ESTADOS_VALIDOS) {
    assert.equal(esEstadoValido(estado), true);
  }
  assert.equal(esEstadoValido('en_proceso'), false);
  assert.equal(esEstadoValido(''), false);
  assert.equal(esEstadoValido(undefined), false);
});

test('bloqueaHueco: cancelada libera, el resto bloquea', () => {
  assert.equal(bloqueaHueco('pendiente'), true);
  assert.equal(bloqueaHueco('confirmada'), true);
  assert.equal(bloqueaHueco('completada'), true);
  assert.equal(bloqueaHueco('cancelada'), false);
});
