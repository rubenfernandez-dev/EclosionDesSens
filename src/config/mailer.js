const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Traducciones para emails
const emailTranslations = {
  fr: {
    confirmacion_titulo: 'Merci pour votre réservation, {nombre}!',
    confirmacion_subtitulo: 'Nous avons reçu votre demande de réservation. Voici les détails:',
    fecha: 'Date',
    hora: 'Heure',
    tipo_masaje: 'Type de massage',
    tu_mensaje: 'Votre message',
    estado_confirmada: 'La réservation est confirmée',
    duda_contacta: 'Si vous avez des questions, n\'hésitez pas à nous contacter.',
    esperamos_pronto: 'Nous vous attendons bientôt pour vous offrir un moment de détente absolue.',
    empresa_nueva_reserva: 'Nouvelle Réservation Reçue',
    cliente: 'Client',
    telefono: 'Téléphone',
    email: 'Email',
    mensaje: 'Message',
    registrada_el: 'Réservation reçue le'
  }
};

function getTranslation(idioma, key) {
  const lang = idioma && emailTranslations[idioma] ? idioma : 'fr';
  return emailTranslations[lang][key] || emailTranslations.fr[key];
}

// Configurar transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true para puerto 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Verificar configuración
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en la configuración de correo:', error);
  } else {
    console.log('✅ Servidor de correo listo');
  }
});

/**
 * Enviar confirmación de reserva al cliente
 */
async function enviarConfirmacionReservaCliente(reserva) {
  console.log('📧 Enviando email de confirmación en idioma:', reserva.idioma);
  const t = (key) => getTranslation(reserva.idioma, key);
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: reserva.email,
    subject: reserva.idioma === 'de' ? 'Reservierungsbestätigung - Éclosion des sens' : 
             reserva.idioma === 'fr' ? 'Confirmation de votre réservation - Éclosion des sens' : 
             'Confirmación de tu reserva - Éclosion des sens',
    attachments: [
      {
        filename: 'logo.blanco.jpg',
        path: path.join(__dirname, '..', 'public', 'img', 'logo.blanco.jpg'),
        cid: 'logoheader'
      }
    ],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #5a4a3a; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b7355; color: white; padding: 20px; text-align: center; }
          .logo { margin-bottom: 10px; }
          .content { background-color: #f9f6f2; padding: 30px; }
          .footer { background-color: #e8dfd5; padding: 15px; text-align: center; font-size: 12px; }
          .highlight { color: #8b7355; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="cid:logoheader" alt="Éclosion des sens" style="max-width: 160px; height: auto;">
            </div>
            <h1>Éclosion des sens</h1>
          </div>
          <div class="content">
            <h2>${t('confirmacion_titulo').replace('{nombre}', reserva.nombre)}</h2>
            <p>${t('confirmacion_subtitulo')}</p>
            <ul>
              <li><span class="highlight">${t('fecha')}:</span> ${reserva.fecha_reserva}</li>
              <li><span class="highlight">${t('hora')}:</span> ${reserva.hora_reserva}</li>
              <li><span class="highlight">${t('tipo_masaje')}:</span> ${reserva.tipo_masaje}</li>
            </ul>
            ${reserva.mensaje ? `<p><span class="highlight">${t('tu_mensaje')}:</span> ${reserva.mensaje}</p>` : ''}
            <p>${t('estado_confirmada')}. ${t('duda_contacta')}</p>
            <p>${t('esperamos_pronto')}</p>
          </div>
          <div class="footer">
            <p><strong>Éclosion des sens</strong><br>
            📞 +41 76 575 45 59<br>
            📧 info@eclosiondessens.ch<br>
            🌐 eclosiondessens.ch</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Notificar a la empresa sobre nueva reserva
 */
async function enviarNotificacionReservaEmpresa(reserva) {
  const t = (key) => getTranslation(reserva.idioma, key);
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_EMPRESA,
    subject: reserva.idioma === 'de' ? '🔔 Neue Reservierung eingegangen - Éclosion des sens' : 
             reserva.idioma === 'fr' ? '🔔 Nouvelle réservation reçue - Éclosion des sens' : 
             '🔔 Nueva reserva recibida - Éclosion des sens',
    attachments: [
      {
        filename: 'logo.blanco.jpg',
        path: path.join(__dirname, '..', 'public', 'img', 'logo.blanco.jpg'),
        cid: 'logoheader'
      }
    ],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .content { background-color: white; padding: 20px; border-radius: 5px; }
          h2 { color: #8b7355; }
          .info { background-color: #f9f6f2; padding: 15px; margin: 10px 0; border-left: 4px solid #8b7355; }
          .logo { text-align: center; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo">
              <img src="cid:logoheader" alt="Éclosion des sens" style="max-width: 140px; height: auto;">
            </div>
            <h2>Nueva Reserva Recibida</h2>
            <div class="info">
              <p><strong>Cliente:</strong> ${reserva.nombre}</p>
              <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
              <p><strong>Email:</strong> ${reserva.email}</p>
              <p><strong>Fecha:</strong> ${reserva.fecha_reserva}</p>
              <p><strong>Hora:</strong> ${reserva.hora_reserva}</p>
              <p><strong>Tipo de masaje:</strong> ${reserva.tipo_masaje}</p>
              ${reserva.mensaje ? `<p><strong>Mensaje:</strong> ${reserva.mensaje}</p>` : ''}
            </div>
            <p><small>Reserva registrada el: ${new Date().toLocaleString('es-ES')}</small></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Notificar a la empresa sobre nuevo mensaje de contacto
 */
async function enviarNotificacionContactoEmpresa(contacto) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_EMPRESA,
    subject: '📩 Nuevo mensaje de contacto - Éclosion des sens',
    attachments: [
      {
        filename: 'logo.blanco.jpg',
        path: path.join(__dirname, '..', 'public', 'img', 'logo.blanco.jpg'),
        cid: 'logoheader'
      }
    ],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .content { background-color: white; padding: 20px; border-radius: 5px; }
          h2 { color: #8b7355; }
          .info { background-color: #f9f6f2; padding: 15px; margin: 10px 0; border-left: 4px solid #8b7355; }
          .mensaje { background-color: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
          .logo { text-align: center; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo">
              <img src="cid:logoheader" alt="Éclosion des sens" style="max-width: 140px; height: auto;">
            </div>
            <h2>Nuevo Mensaje de Contacto</h2>
            <div class="info">
              <p><strong>Nombre:</strong> ${contacto.nombre}</p>
              <p><strong>Email:</strong> ${contacto.email}</p>
            </div>
            <div class="mensaje">
              <p><strong>Mensaje:</strong></p>
              <p>${contacto.mensaje}</p>
            </div>
            <p><small>Mensaje recibido el: ${new Date().toLocaleString('es-ES')}</small></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  enviarConfirmacionReservaCliente,
  enviarNotificacionReservaEmpresa,
  enviarNotificacionContactoEmpresa
};
