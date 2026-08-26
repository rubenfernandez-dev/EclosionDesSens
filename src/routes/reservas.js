const express = require('express');
const router = express.Router();
const db = require('../config/db');
const {
  enviarConfirmacionReservaCliente,
  enviarNotificacionReservaEmpresa
} = require('../config/mailer');
const {
  esFechaValida,
  esFechaHoraFutura,
  esHoraValida,
  normalizarHora,
  esTipoMasajeValido,
  resolverDisponibilidad
} = require('../utils/reservasValidacion');

/**
 * POST /api/reservas
 * Registrar nueva reserva.
 *
 * `reservas` es la única fuente de verdad sobre qué huecos están ocupados
 * (no existe `disponibilidad_bloqueada` en producción). Para evitar dobles
 * reservas por concurrencia, toda la comprobación de disponibilidad y de
 * conflicto ocurre DENTRO de una única transacción: primero se bloquean con
 * `SELECT ... FOR UPDATE` las filas de `disponibilidad` relevantes para esa
 * fecha+hora (excepción puntual y/o slot recurrente); solo tras adquirir ese
 * lock se comprueba `reservas` en busca de conflicto e inserta. Dos requests
 * simultáneos para el mismo slot compiten por el mismo lock de fila de
 * `disponibilidad`, así que se serializan y solo uno puede terminar en 201.
 */
router.post('/', async (req, res) => {
  const { nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje, idioma } = req.body;

  // Validación de campos obligatorios
  if (!nombre || !telefono || !email || !fecha_reserva || !hora_reserva || !tipo_masaje) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos obligatorios deben ser completados'
    });
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'El formato del email no es válido'
    });
  }

  if (!esTipoMasajeValido(tipo_masaje)) {
    return res.status(400).json({
      success: false,
      message: 'El tipo de masaje seleccionado no es válido'
    });
  }

  if (!esFechaValida(fecha_reserva)) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de la reserva no es válida'
    });
  }

  if (!esHoraValida(hora_reserva)) {
    return res.status(400).json({
      success: false,
      message: 'La hora de la reserva no es válida'
    });
  }

  const horaNormalizada = normalizarHora(hora_reserva);

  if (!esFechaHoraFutura(fecha_reserva, horaNormalizada)) {
    return res.status(400).json({
      success: false,
      message: 'La fecha y hora de la reserva deben ser futuras'
    });
  }

  const diaSemana = new Date(`${fecha_reserva}T00:00:00`).getDay();

  const connection = await db.getConnection();
  let insertId;
  try {
    await connection.beginTransaction();

    // 1) Bloquear (FOR UPDATE) las filas de disponibilidad relevantes para
    //    esta fecha+hora exacta: la excepción puntual (si existe) y/o el
    //    slot recurrente del mismo día de semana. Esto es lo que serializa
    //    a dos requests concurrentes sobre el mismo slot.
    const [filasDisponibilidad] = await connection.execute(
      'SELECT fecha, hora, disponible FROM disponibilidad WHERE hora = ? AND (fecha = ? OR (fecha IS NULL AND dia_semana = ?)) FOR UPDATE',
      [horaNormalizada, fecha_reserva, diaSemana]
    );

    if (!resolverDisponibilidad(filasDisponibilidad, horaNormalizada)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No hay disponibilidad para la fecha y hora seleccionadas'
      });
    }

    // 2) Con el lock de disponibilidad ya adquirido, comprobar conflicto
    //    directamente contra `reservas` (única fuente de verdad).
    const [existingReserva] = await connection.execute(
      'SELECT id FROM reservas WHERE fecha_reserva = ? AND hora_reserva = ? AND estado != "cancelada"',
      [fecha_reserva, horaNormalizada]
    );

    if (existingReserva.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Lo sentimos, ese horario ya está reservado. Por favor, elige otro.'
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO reservas
       (nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada')`,
      [nombre, telefono, email, fecha_reserva, horaNormalizada, tipo_masaje, mensaje || null]
    );
    insertId = result.insertId;

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al procesar reserva:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la reserva. Por favor, inténtalo de nuevo.'
    });
  } finally {
    connection.release();
  }

  // Preparar datos para los emails
  const reservaData = {
    nombre,
    telefono,
    email,
    fecha_reserva,
    hora_reserva: horaNormalizada,
    tipo_masaje,
    mensaje,
    idioma: idioma || 'fr'
  };

  // Enviar correos electrónicos
  try {
    // Email al cliente
    await enviarConfirmacionReservaCliente(reservaData);

    // Email a la empresa
    await enviarNotificacionReservaEmpresa(reservaData);

    console.log(`✅ Reserva registrada: ${nombre} - ${fecha_reserva} ${horaNormalizada}`);
  } catch (emailError) {
    console.error('⚠️ Error al enviar emails:', emailError);
    // Continuar aunque falle el email
  }

  res.status(201).json({
    success: true,
    message: 'Reserva registrada exitosamente. Te hemos enviado un correo de confirmación.',
    reservaId: insertId
  });
});

/**
 * GET /api/reservas/disponibilidad
 * Lista de horarios recurrentes (público)
 */
router.get('/disponibilidad', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT dia_semana, hora, disponible FROM disponibilidad WHERE fecha IS NULL ORDER BY dia_semana ASC, hora ASC'
    );

    res.json({ success: true, disponibilidad: rows });
  } catch (error) {
    console.error('❌ Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo obtener la disponibilidad'
    });
  }
});

/**
 * GET /api/reservas/disponibilidad/:fecha
 * Horarios disponibles para una fecha específica: slots abiertos según
 * disponibilidad (excepción puntual > recurrente) menos los ya ocupados por
 * una reserva activa en `reservas` (estado != 'cancelada').
 */
router.get('/disponibilidad/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;

    if (!esFechaValida(fecha)) {
      return res.status(400).json({
        success: false,
        message: 'Fecha no válida'
      });
    }

    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();

    // Slots recurrentes del día de la semana + excepciones específicas de esta fecha
    const [slots] = await db.execute(
      'SELECT fecha, hora, disponible FROM disponibilidad WHERE fecha = ? OR (fecha IS NULL AND dia_semana = ?)',
      [fecha, diaSemana]
    );

    const efectivos = new Map();
    slots
      .filter(s => s.fecha === null)
      .forEach(s => efectivos.set(String(s.hora).slice(0, 8), !!s.disponible));
    slots
      .filter(s => s.fecha !== null)
      .forEach(s => efectivos.set(String(s.hora).slice(0, 8), !!s.disponible)); // la excepción prevalece

    const horasAbiertas = [...efectivos.entries()].filter(([, abierto]) => abierto).map(([hora]) => hora);

    // Horas ya ocupadas: directamente contra reservas activas de esa fecha
    const [ocupadas] = await db.execute(
      "SELECT DISTINCT hora_reserva FROM reservas WHERE fecha_reserva = ? AND estado != 'cancelada'",
      [fecha]
    );

    const horasOcupadas = new Set(ocupadas.map(r => String(r.hora_reserva).slice(0, 8)));
    const horariosDisponibles = horasAbiertas
      .filter(h => !horasOcupadas.has(h))
      .sort()
      .map(hora => ({ hora: hora.slice(0, 5) }));

    res.json({ success: true, disponibilidad: horariosDisponibles });
  } catch (error) {
    console.error('❌ Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo obtener la disponibilidad'
    });
  }
});

module.exports = router;
