const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { enviarNotificacionContactoEmpresa } = require('../config/mailer');

/**
 * POST /api/contacto
 * Registrar nuevo mensaje de contacto
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
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

    // Validación de longitud del mensaje
    if (mensaje.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje debe tener al menos 10 caracteres'
      });
    }

    // Insertar mensaje en la base de datos
    const query = `
      INSERT INTO contactos (nombre, email, mensaje)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [nombre, email, mensaje]);

    // Preparar datos para el email
    const contactoData = {
      nombre,
      email,
      mensaje
    };

    // Enviar notificación por email a la empresa
    try {
      await enviarNotificacionContactoEmpresa(contactoData);
      console.log(`✅ Mensaje de contacto registrado: ${nombre} (${email})`);
    } catch (emailError) {
      console.error('⚠️ Error al enviar email de notificación:', emailError);
      // Continuar aunque falle el email
    }

    res.status(201).json({
      success: true,
      message: 'Tu mensaje ha sido enviado correctamente. Te responderemos pronto.',
      contactoId: result.insertId
    });

  } catch (error) {
    console.error('❌ Error al procesar mensaje de contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.'
    });
  }
});

module.exports = router;
