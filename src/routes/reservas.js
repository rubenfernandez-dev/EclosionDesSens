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

    // Insertar reserva en la base de datos
    const query = `
      INSERT INTO reservas 
      (nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?)
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

module.exports = router;
