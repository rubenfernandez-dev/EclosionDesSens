const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TIPOS_MASAJE_VALIDOS,
  esFechaValida,
  obtenerAhoraNegocio,
  esFechaHoraFutura,
  esHoraValida,
  normalizarHora,
  esTipoMasajeValido,
  resolverDisponibilidad,
  MAX_DIAS_RANGO_FECHAS,
  diasEnRango,
  calcularFechasDisponibles
} = require('../src/utils/reservasValidacion');

test('esFechaValida rechaza formatos y fechas de calendario inválidas', () => {
  assert.equal(esFechaValida('2026-13-01'), false); // mes inválido
  assert.equal(esFechaValida('2026-02-30'), false); // desborde de calendario
  assert.equal(esFechaValida('26-01-2026'), false); // formato incorrecto
  assert.equal(esFechaValida('2026-01-15'), true);
});

test('obtenerAhoraNegocio convierte a Europe/Zurich sin depender de la TZ del proceso', () => {
  // Enero: CET = UTC+1. Independiente de la TZ del sistema operativo donde corra el test.
  assert.deepEqual(
    obtenerAhoraNegocio(new Date('2026-01-15T12:00:00Z')),
    { fecha: '2026-01-15', hora: '13:00:00' }
  );
  // Julio: CEST = UTC+2 (horario de verano).
  assert.deepEqual(
    obtenerAhoraNegocio(new Date('2026-07-15T12:00:00Z')),
    { fecha: '2026-07-15', hora: '14:00:00' }
  );
});

test('esFechaHoraFutura: fecha anterior a hoy -> false', () => {
  const ahora = { fecha: '2026-08-26', hora: '12:00:00' };
  assert.equal(esFechaHoraFutura('2026-08-25', '23:59:00', ahora), false);
});

test('esFechaHoraFutura: hoy y hora <= hora actual -> false', () => {
  const ahora = { fecha: '2026-08-26', hora: '12:00:00' };
  assert.equal(esFechaHoraFutura('2026-08-26', '12:00:00', ahora), false); // igual
  assert.equal(esFechaHoraFutura('2026-08-26', '11:59:00', ahora), false); // ya pasó
});

test('esFechaHoraFutura: hoy y hora futura -> true', () => {
  const ahora = { fecha: '2026-08-26', hora: '12:00:00' };
  assert.equal(esFechaHoraFutura('2026-08-26', '12:00:01', ahora), true);
});

test('esFechaHoraFutura: fecha futura -> true', () => {
  const ahora = { fecha: '2026-08-26', hora: '12:00:00' };
  assert.equal(esFechaHoraFutura('2026-08-27', '00:00:00', ahora), true);
});

test('esHoraValida solo acepta HH:MM u HH:MM:SS en rango', () => {
  assert.equal(esHoraValida('04:30'), true); // formato válido, la disponibilidad se valida aparte
  assert.equal(esHoraValida('24:00'), false);
  assert.equal(esHoraValida('17:60'), false);
  assert.equal(esHoraValida('17:00:00'), true);
  assert.equal(normalizarHora('17:00'), '17:00:00');
});

test('esTipoMasajeValido solo acepta el catálogo del formulario público', () => {
  for (const tipo of TIPOS_MASAJE_VALIDOS) {
    assert.equal(esTipoMasajeValido(tipo), true);
  }
  assert.equal(esTipoMasajeValido('Masaje Inventado (999 min)'), false);
  assert.equal(esTipoMasajeValido(''), false);
});

test('resolverDisponibilidad: sin filas no hay disponibilidad', () => {
  assert.equal(resolverDisponibilidad([], '04:30:00'), false);
});

test('resolverDisponibilidad: una fila semanal legacy (fecha NULL) nunca da disponibilidad', () => {
  const filas = [{ fecha: null, hora: '17:00:00', disponible: 1 }];
  assert.equal(resolverDisponibilidad(filas, '17:00:00'), false);
});

test('resolverDisponibilidad: slot con fecha concreta disponible', () => {
  const filas = [{ fecha: new Date('2026-12-25'), hora: '11:00:00', disponible: 1 }];
  assert.equal(resolverDisponibilidad(filas, '11:00:00'), true);
});

test('resolverDisponibilidad: slot con fecha concreta no disponible', () => {
  const filas = [{ fecha: new Date('2026-12-25'), hora: '11:00:00', disponible: 0 }];
  assert.equal(resolverDisponibilidad(filas, '11:00:00'), false);
});

test('resolverDisponibilidad: la hora debe coincidir con el slot configurado', () => {
  const filas = [{ fecha: new Date('2026-12-25'), hora: '11:00:00', disponible: 1 }];
  assert.equal(resolverDisponibilidad(filas, '03:00:00'), false);
});

// ----------------------------------------------------------------------
// calcularFechasDisponibles (compartida con GET /fechas-disponibles)
// ----------------------------------------------------------------------

const AHORA = { fecha: '2026-09-26', hora: '12:00:00' };
const s = (fecha, hora) => ({ fecha, hora });
const r = (fecha_reserva, hora_reserva) => ({ fecha_reserva, hora_reserva });

test('calcularFechasDisponibles: fecha con una hora libre -> aparece', () => {
  const slots = [s('2026-10-03', '10:00:00'), s('2026-10-03', '11:00:00')];
  assert.deepEqual(calcularFechasDisponibles(slots, [r('2026-10-03', '10:00:00')], AHORA), ['2026-10-03']);
});

test('calcularFechasDisponibles: sin slots -> lista vacía', () => {
  assert.deepEqual(calcularFechasDisponibles([], [], AHORA), []);
});

test('calcularFechasDisponibles: filas semanales legacy (fecha NULL) se ignoran', () => {
  assert.deepEqual(calcularFechasDisponibles([s(null, '10:00:00')], [], AHORA), []);
});

test('calcularFechasDisponibles: todos los slots ocupados -> no aparece', () => {
  const slots = [s('2026-10-08', '10:00:00'), s('2026-10-08', '11:00:00')];
  const ocupadas = [r('2026-10-08', '10:00:00'), r('2026-10-08', '11:00:00')];
  assert.deepEqual(calcularFechasDisponibles(slots, ocupadas, AHORA), []);
});

test('calcularFechasDisponibles: una reserva a la misma hora de otro día no ocupa el slot', () => {
  const slots = [s('2026-10-08', '10:00:00')];
  assert.deepEqual(calcularFechasDisponibles(slots, [r('2026-10-09', '10:00:00')], AHORA), ['2026-10-08']);
});

test('calcularFechasDisponibles: fecha pasada -> no aparece', () => {
  assert.deepEqual(calcularFechasDisponibles([s('2026-09-25', '15:00:00')], [], AHORA), []);
});

test('calcularFechasDisponibles: hoy con todas las horas pasadas -> no aparece', () => {
  const slots = [s('2026-09-26', '11:00:00'), s('2026-09-26', '12:00:00')];
  assert.deepEqual(calcularFechasDisponibles(slots, [], AHORA), []);
});

test('calcularFechasDisponibles: hoy con una hora futura -> aparece', () => {
  const slots = [s('2026-09-26', '11:00:00'), s('2026-09-26', '12:00:01')];
  assert.deepEqual(calcularFechasDisponibles(slots, [], AHORA), ['2026-09-26']);
});

test('calcularFechasDisponibles: varios slots en la misma fecha -> una única vez y ordenadas', () => {
  const slots = [
    s('2026-10-14', '18:00:00'),
    s('2026-10-03', '10:00:00'),
    s('2026-10-14', '09:00:00')
  ];
  assert.deepEqual(calcularFechasDisponibles(slots, [], AHORA), ['2026-10-03', '2026-10-14']);
});

test('calcularFechasDisponibles: acepta fechas devueltas como Date por mysql2', () => {
  const slots = [{ fecha: new Date(2026, 9, 3), hora: '10:00:00' }, { fecha: new Date(2026, 9, 4), hora: '10:00:00' }];
  const ocupadas = [{ fecha_reserva: new Date(2026, 9, 4), hora_reserva: '10:00:00' }];
  assert.deepEqual(calcularFechasDisponibles(slots, ocupadas, AHORA), ['2026-10-03']);
});

test('diasEnRango cuenta ambos extremos, también con cambio de horario', () => {
  assert.equal(diasEnRango('2026-10-01', '2026-10-01'), 1);
  assert.equal(diasEnRango('2026-10-01', '2026-10-31'), 31);
  assert.equal(diasEnRango('2026-03-01', '2026-03-31'), 31);
  assert.equal(diasEnRango('2026-10-01', '2026-12-01'), MAX_DIAS_RANGO_FECHAS);
});
