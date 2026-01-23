const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { 
  enviarConfirmacionReservaCliente, 
  enviarNotificacionReservaEmpresa 
} = require('../config/mailer');

/**
 * POST /api/reservas
 * Registrar nueva reserva
 */
router.post('/', async (req, res) => {
  try {
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

    // ✅ VERIFICAR SI YA EXISTE RESERVA EN ESA FECHA Y HORA
    const [existingReserva] = await db.execute(
      'SELECT id FROM reservas WHERE fecha_reserva = ? AND hora_reserva = ? AND estado != "cancelada"',
      [fecha_reserva, hora_reserva]
    );

    if (existingReserva.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Lo sentimos, ese horario ya está reservado. Por favor, elige otro.'
      });
    }

    // Insertar reserva en la base de datos
    const query = `
      INSERT INTO reservas 
      (nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada')
    `;

    const [result] = await db.execute(query, [
      nombre, 
      telefono, 
      email, 
      fecha_reserva, 
      hora_reserva, 
      tipo_masaje, 
      mensaje || null
    ]);

    // ✅ BLOQUEAR ESTE HORARIO EN LA TABLA DE DISPONIBILIDAD
    try {
      await db.execute(
        'INSERT INTO disponibilidad_bloqueada (fecha_reserva, hora_reserva, reserva_id) VALUES (?, ?, ?)',
        [fecha_reserva, hora_reserva, result.insertId]
      );
      console.log(`✅ Horario bloqueado: ${fecha_reserva} ${hora_reserva}`);
    } catch (blockError) {
      console.error('⚠️ Aviso al bloquear horario:', blockError);
    }

    // Preparar datos para los emails
    const reservaData = {
      nombre,
      telefono,
      email,
      fecha_reserva,
      hora_reserva,
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
      
      console.log(`✅ Reserva registrada: ${nombre} - ${fecha_reserva} ${hora_reserva}`);
    } catch (emailError) {
      console.error('⚠️ Error al enviar emails:', emailError);
      // Continuar aunque falle el email
    }

    res.status(201).json({
      success: true,
      message: 'Reserva registrada exitosamente. Te hemos enviado un correo de confirmación.',
      reservaId: result.insertId
    });

  } catch (error) {
    console.error('❌ Error al procesar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la reserva. Por favor, inténtalo de nuevo.'
    });
  }
});

/**
 * GET /api/reservas/disponibilidad
 * Lista de horarios disponibles (público)
 */
router.get('/disponibilidad', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT dia_semana, hora, disponible FROM disponibilidad ORDER BY dia_semana ASC, hora ASC'
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
 * Obtener horarios disponibles para una fecha específica
 */
router.get('/disponibilidad/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    const diaSemana = new Date(fecha).getDay();

    // Obtener horarios base del día de la semana
    const [horarios] = await db.execute(
      'SELECT hora FROM disponibilidad WHERE dia_semana = ? AND disponible = 1 ORDER BY hora ASC',
      [diaSemana]
    );

    // Obtener horarios ya reservados en esa fecha
    const [reservados] = await db.execute(
      'SELECT DISTINCT hora_reserva FROM disponibilidad_bloqueada WHERE fecha_reserva = ?',
      [fecha]
    );

    const horariosReservados = reservados.map(r => r.hora_reserva);
    const horariosDisponibles = horarios.filter(h => {
      const timeStr = h.hora.toString().slice(0, 5);
      return !horariosReservados.includes(timeStr);
    });

    res.json({ success: true, disponibilidad: horariosDisponibles });
  } catch (error) {
    console.error('❌ Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo obtener la disponibilidad'
    });
  }
});

/**
 * DELETE /api/reservas/:id
 * Cancelar una reserva y liberar el horario
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos de la reserva
    const [reserva] = await db.execute(
      'SELECT * FROM reservas WHERE id = ?',
      [id]
    );

    if (reserva.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Actualizar estado a cancelada
    await db.execute(
      'UPDATE reservas SET estado = "cancelada" WHERE id = ?',
      [id]
    );

    // Liberar horario de la tabla de bloqueo
    await db.execute(
      'DELETE FROM disponibilidad_bloqueada WHERE reserva_id = ?',
      [id]
    );

    console.log(`✅ Reserva ${id} cancelada y horario liberado`);

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente. El horario está disponible nuevamente.'
    });
  } catch (error) {
    console.error('❌ Error al cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la reserva'
    });
  }
});

module.exports = router;
