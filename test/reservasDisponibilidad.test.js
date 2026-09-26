const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');

// Tests de comportamiento de src/routes/reservas.js. Para no abrir conexiones
// reales (MySQL/SMTP, ver nota en reservasRoutes.test.js), se registran dobles
// de src/config/db.js y src/config/mailer.js en require.cache ANTES de cargar
// el router.
//
// La BD falsa evalúa las condiciones reales del WHERE (solo `col = ?`,
// `col = 1` y `col != "valor"` unidas por AND). Cualquier otra construcción
// (OR, IS NULL, paréntesis...) lanza error: así un fallback a horarios
// semanales en las consultas haría fallar los tests.

const estado = { disponibilidad: [], reservas: [] };

function evaluarWhere(sql, params) {
  const match = sql.match(/\bWHERE\s+([\s\S]+?)(?:\s+FOR UPDATE)?\s*$/i);
  if (!match) return () => true;
  const clausula = match[1];
  if (/\bOR\b|\bIS\s+NULL\b|[()]/i.test(clausula)) {
    throw new Error(`SQL no soportado por la BD falsa: ${sql}`);
  }
  let i = 0;
  const condiciones = clausula.split(/\s+AND\s+/i).map(cond => {
    let m;
    if ((m = cond.match(/^(\w+)\s*=\s*\?$/))) {
      const valor = params[i++];
      return fila => String(fila[m[1]]) === String(valor);
    }
    if ((m = cond.match(/^(\w+)\s*=\s*(\d+)$/))) {
      return fila => Number(fila[m[1]]) === Number(m[2]);
    }
    if ((m = cond.match(/^(\w+)\s*!=\s*["'](\w+)["']$/))) {
      return fila => fila[m[1]] !== m[2];
    }
    throw new Error(`Condición no soportada por la BD falsa: ${cond}`);
  });
  return fila => condiciones.every(c => c(fila));
}

async function execute(sql, params = []) {
  const sqlPlano = sql.replace(/\s+/g, ' ').trim();
  if (/^INSERT INTO reservas/i.test(sqlPlano)) {
    const [nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje] = params;
    const id = estado.reservas.length + 1;
    estado.reservas.push({ id, nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje, estado: 'confirmada' });
    return [{ insertId: id }];
  }
  const tabla = sqlPlano.match(/\bFROM (\w+)/i)?.[1];
  if (!estado[tabla]) throw new Error(`Tabla desconocida en la BD falsa: ${sql}`);
  return [estado[tabla].filter(evaluarWhere(sqlPlano, params))];
}

const dbFalsa = {
  execute,
  getConnection: async () => ({
    execute,
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {}
  })
};

function registrarMock(rutaRelativa, exportsFalsos) {
  const ruta = require.resolve(path.join(__dirname, '..', 'src', rutaRelativa));
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports: exportsFalsos };
}

registrarMock('config/db.js', dbFalsa);
registrarMock('config/mailer.js', {
  enviarConfirmacionReservaCliente: async () => {},
  enviarNotificacionReservaEmpresa: async () => {}
});

const reservasRouter = require('../src/routes/reservas');

const FECHA = '2099-09-26';
const FECHA_SIN_CONFIG = '2099-09-27';
const DIA_SEMANA = new Date(`${FECHA}T00:00:00Z`).getUTCDay();

let servidor;
let baseUrl;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/reservas', reservasRouter);
  await new Promise(resolve => {
    servidor = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${servidor.address().port}/api/reservas`;
});

test.after(() => new Promise(resolve => servidor.close(resolve)));

test.beforeEach(() => {
  estado.reservas = [];
  estado.disponibilidad = [
    { id: 1, dia_semana: DIA_SEMANA, fecha: FECHA, hora: '15:00:00', disponible: 1 },
    { id: 2, dia_semana: DIA_SEMANA, fecha: FECHA, hora: '10:00:00', disponible: 1 },
    { id: 3, dia_semana: DIA_SEMANA, fecha: FECHA, hora: '11:30:00', disponible: 1 },
    { id: 4, dia_semana: DIA_SEMANA, fecha: FECHA, hora: '18:00:00', disponible: 0 },
    // Filas legacy semanales (fecha NULL) para el mismo día de la semana:
    // no deben tener ningún efecto.
    { id: 5, dia_semana: DIA_SEMANA, fecha: null, hora: '17:00:00', disponible: 1 },
    { id: 6, dia_semana: (DIA_SEMANA + 1) % 7, fecha: null, hora: '17:00:00', disponible: 1 }
  ];
});

async function obtenerHoras(fecha) {
  const res = await fetch(`${baseUrl}/disponibilidad/${fecha}`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  return data.disponibilidad.map(s => s.hora);
}

function reservar(fecha_reserva, hora_reserva) {
  return fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Test',
      telefono: '000000000',
      email: 'test@example.com',
      fecha_reserva,
      hora_reserva,
      tipo_masaje: 'Masaje Combinado (90 min)'
    })
  });
}

test('GET /disponibilidad/:fecha devuelve únicamente los slots disponibles de esa fecha, ordenados', async () => {
  assert.deepEqual(await obtenerHoras(FECHA), ['10:00', '11:30', '15:00']);
});

test('GET /disponibilidad/:fecha sin configuración devuelve lista vacía (aunque haya filas semanales)', async () => {
  assert.deepEqual(await obtenerHoras(FECHA_SIN_CONFIG), []);
});

test('GET /disponibilidad/:fecha no incluye filas semanales fecha IS NULL', async () => {
  assert.equal((await obtenerHoras(FECHA)).includes('17:00'), false);
});

test('GET /disponibilidad/:fecha excluye slots ocupados por reservas activas', async () => {
  estado.reservas.push({ id: 1, fecha_reserva: FECHA, hora_reserva: '10:00:00', estado: 'confirmada' });
  estado.reservas.push({ id: 2, fecha_reserva: FECHA, hora_reserva: '11:30:00', estado: 'cancelada' });
  assert.deepEqual(await obtenerHoras(FECHA), ['11:30', '15:00']);
});

test('GET /disponibilidad (horarios semanales) ya no existe', async () => {
  const res = await fetch(`${baseUrl}/disponibilidad`);
  assert.equal(res.status, 404);
});

test('POST a una hora configurada para la fecha -> 201', async () => {
  const res = await reservar(FECHA, '11:30');
  assert.equal(res.status, 201);
  assert.equal(estado.reservas.length, 1);
  assert.equal(estado.reservas[0].hora_reserva, '11:30:00');
});

test('POST a una hora no configurada -> 400', async () => {
  const res = await reservar(FECHA, '03:00');
  assert.equal(res.status, 400);
  assert.equal(estado.reservas.length, 0);
});

test('POST a un slot configurado pero con disponible = 0 -> 400', async () => {
  const res = await reservar(FECHA, '18:00');
  assert.equal(res.status, 400);
  assert.equal(estado.reservas.length, 0);
});

test('POST a una hora de una fila semanal fecha IS NULL -> 400', async () => {
  assert.equal((await reservar(FECHA, '17:00')).status, 400);
  assert.equal((await reservar(FECHA_SIN_CONFIG, '17:00')).status, 400);
  assert.equal(estado.reservas.length, 0);
});

test('POST a un slot ya ocupado -> 409', async () => {
  assert.equal((await reservar(FECHA, '15:00')).status, 201);
  const res = await reservar(FECHA, '15:00');
  assert.equal(res.status, 409);
  assert.equal(estado.reservas.length, 1);
});

// --- Horas pasadas: GET /disponibilidad/:fecha solo devuelve horas futuras
// según la hora del negocio (Europe/Zurich). Se congela `Date` con
// mock.timers para no depender del reloj ni de la TZ de la máquina.

async function horasConAhora(instanteUtc, slots, fecha) {
  estado.disponibilidad = slots;
  test.mock.timers.enable({ apis: ['Date'], now: new Date(instanteUtc) });
  try {
    return await obtenerHoras(fecha);
  } finally {
    test.mock.timers.reset();
  }
}

const slot = (id, fecha, hora) => ({ id, dia_semana: 0, fecha, hora, disponible: 1 });

test('GET /disponibilidad/:fecha con fecha pasada -> lista vacía', async () => {
  // 2026-09-26 10:00 UTC = 12:00 en Zúrich (CEST)
  const horas = await horasConAhora('2026-09-26T10:00:00Z', [
    slot(1, '2026-09-25', '15:00:00'),
    slot(2, '2026-09-25', '23:00:00')
  ], '2026-09-25');
  assert.deepEqual(horas, []);
});

test('GET /disponibilidad/:fecha hoy -> solo horas posteriores a la actual (Zúrich)', async () => {
  // 12:00 en Zúrich: 11:00 pasada, 12:00 no es posterior, 13:00 futura
  const horas = await horasConAhora('2026-09-26T10:00:00Z', [
    slot(1, '2026-09-26', '11:00:00'),
    slot(2, '2026-09-26', '12:00:00'),
    slot(3, '2026-09-26', '13:00:00')
  ], '2026-09-26');
  assert.deepEqual(horas, ['13:00']);
});

test('GET /disponibilidad/:fecha futura -> mantiene todas las horas configuradas', async () => {
  const horas = await horasConAhora('2026-09-26T10:00:00Z', [
    slot(1, '2026-09-27', '08:00:00'),
    slot(2, '2026-09-27', '18:00:00')
  ], '2026-09-27');
  assert.deepEqual(horas, ['08:00', '18:00']);
});

test('GET /disponibilidad/:fecha usa el día de Zúrich, no el de UTC', async () => {
  // 2026-09-26 22:30 UTC = 2026-09-27 00:30 en Zúrich:
  // el 26 ya es pasado y el 27 es "hoy" (00:00 pasada, 09:00 futura).
  const slots = [
    slot(1, '2026-09-26', '23:00:00'),
    slot(2, '2026-09-27', '00:00:00'),
    slot(3, '2026-09-27', '09:00:00')
  ];
  assert.deepEqual(await horasConAhora('2026-09-26T22:30:00Z', slots, '2026-09-26'), []);
  assert.deepEqual(await horasConAhora('2026-09-26T22:30:00Z', slots, '2026-09-27'), ['09:00']);
});
