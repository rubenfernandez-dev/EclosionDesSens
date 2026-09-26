const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const db = require('../config/db');
const { esEstadoValido, bloqueaHueco } = require('../utils/estadosReserva');
const { esFechaValida } = require('../utils/reservasValidacion');
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,

  // Un login correcto no consume intentos.
  skipSuccessfulRequests: true,

  standardHeaders: 'draft-8',
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.'
  }
});

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  return req.session.csrfToken;
}

function requireCsrf(req, res, next) {
  const expectedToken = req.session?.csrfToken;
  const receivedToken = req.get('X-CSRF-Token');

  if (!expectedToken || !receivedToken) {
    return res.status(403).json({
      success: false,
      message: 'Token CSRF inválido o ausente'
    });
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const receivedBuffer = Buffer.from(receivedToken);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return res.status(403).json({
      success: false,
      message: 'Token CSRF inválido o ausente'
    });
  }

  return next();
}

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ========================================

function requireAdmin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'No autorizado'
  });
}

// ========================================
// LOGIN
// ========================================

router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son obligatorios'
      });
    }

    const [rows] = await db.execute(
      'SELECT id, username, password_hash, role FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = rows[0];

    const isValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Regenerar completamente la sesión después de autenticar
    // para evitar ataques de session fixation.
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };


    req.session.csrfToken = crypto.randomBytes(32).toString('hex');

    // Guardar explícitamente la nueva sesión antes de responder.
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    return res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error en login admin:', error);

    return res.status(500).json({
      success: false,
      message: 'Error en el inicio de sesión'
    });
  }
});

// ========================================
// PROTECCIÓN CSRF
// ========================================

router.use((req, res, next) => {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  return requireCsrf(req, res, next);
});

// ========================================
// LOGOUT
// ========================================

router.post('/logout', (req, res) => {
  if (!req.session) {
    res.clearCookie(process.env.SESSION_NAME || 'eds.sid');

    return res.json({
      success: true
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error al cerrar sesión admin:', err);

      return res.status(500).json({
        success: false,
        message: 'No se pudo cerrar la sesión'
      });
    }

    res.clearCookie(process.env.SESSION_NAME || 'eds.sid');

    return res.json({
      success: true
    });
  });
});

// ========================================
// USUARIO ACTUAL
// ========================================

router.get('/me', requireAdmin, (req, res) => {
const csrfToken = ensureCsrfToken(req);
  res.json({
    success: true,
    user: req.session.user,
    csrfToken
  });
});

// ========================================
// CAMBIO DE CONTRASEÑA
// ========================================

router.patch('/me/password', requireAdmin, async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      newPasswordConfirm
    } = req.body;

    const userId = req.session.user.id;

    if (
      !currentPassword ||
      !newPassword ||
      !newPasswordConfirm
    ) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas nuevas no coinciden'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const [rows] = await db.execute(
      'SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = rows[0];

    const isValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    const newHash = await bcrypt.hash(
      newPassword,
      10
    );

    await db.execute(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [newHash, userId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error(
      '❌ Error al cambiar contraseña:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'No se pudo cambiar la contraseña'
    });
  }
});

// ========================================
// RESERVAS
// ========================================

router.get('/reservas', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        id,
        nombre,
        telefono,
        email,
        fecha_reserva,
        hora_reserva,
        tipo_masaje,
        estado,
        notas,
        mensaje,
        created_at
       FROM reservas
       ORDER BY fecha_reserva DESC, hora_reserva DESC`
    );

    res.json({
      success: true,
      reservas: rows
    });
  } catch (error) {
    console.error(
      '❌ Error al obtener reservas:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'No se pudo obtener las reservas'
    });
  }
});

router.patch('/reservas/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { estado, notas } = req.body;

  if (estado !== undefined && !esEstadoValido(estado)) {
    return res.status(400).json({ success: false, message: 'Estado no válido' });
  }

  if (estado === undefined && notas === undefined) {
    return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let reservaActual = null;
    if (estado !== undefined) {
      // FOR UPDATE: bloquea esta fila concreta y evita que la lectura del
      // estado actual establezca ya el snapshot de la transacción (ver nota
      // más abajo sobre por qué eso importa para la comprobación de conflicto).
      const [rows] = await connection.execute(
        'SELECT estado, fecha_reserva, hora_reserva FROM reservas WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }
      reservaActual = rows[0];

      const bloqueabaAntes = bloqueaHueco(reservaActual.estado);
      const bloqueaAhora = bloqueaHueco(estado);

      // Restaurar una reserva cancelada a un estado que bloquea el hueco:
      // hay que comprobar que nadie más lo haya ocupado mientras tanto.
      // Se bloquea (FOR UPDATE) la misma fila de `disponibilidad` que usa
      // POST /api/reservas, para serializar contra una reserva nueva
      // concurrente sobre el mismo slot. La comprobación de conflicto en
      // `reservas` se hace DESPUÉS de adquirir ese lock, no antes.
      if (!bloqueabaAntes && bloqueaAhora) {
        const horaStr = String(reservaActual.hora_reserva).slice(0, 8);

        await connection.execute(
          'SELECT id FROM disponibilidad WHERE fecha = ? AND hora = ? FOR UPDATE',
          [reservaActual.fecha_reserva, horaStr]
        );

        const [conflicto] = await connection.execute(
          'SELECT id FROM reservas WHERE fecha_reserva = ? AND hora_reserva = ? AND estado != "cancelada" AND id != ?',
          [reservaActual.fecha_reserva, reservaActual.hora_reserva, id]
        );

        if (conflicto.length > 0) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            message: 'No se puede restaurar la reserva: ese horario ya está ocupado por otra reserva'
          });
        }
      }
      // Cancelar (bloqueaAhora === false) simplemente libera el hueco: las
      // consultas de conflicto de POST y GET ya ignoran estado='cancelada',
      // no hace falta ninguna otra operación aquí.
    }

    const updates = [];
    const values = [];
    if (estado !== undefined) {
      updates.push('estado = ?');
      values.push(estado);
    }

    if (notas !== undefined) {
      updates.push('notas = ?');
      values.push(notas || null);
    }
    values.push(id);
    await connection.execute(`UPDATE reservas SET ${updates.join(', ')} WHERE id = ?`, values);

    await connection.commit();
    res.json({ success: true, message: 'Reserva actualizada' });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al actualizar reserva:', error);
    res.status(500).json({ success: false, message: 'No se pudo actualizar la reserva' });
  } finally {
    connection.release();
  }
});

router.delete('/reservas/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      'DELETE FROM reservas WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Reserva eliminada'
    });
  } catch (error) {
    console.error(
      '❌ Error al eliminar reserva:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'No se pudo eliminar la reserva'
    });
  }
});

// ========================================
// DISPONIBILIDAD
// ========================================

router.get(
  '/disponibilidad',
  requireAdmin,
  async (_req, res) => {
    try {
      const [rows] = await db.execute(
        `SELECT
          id,
          dia_semana,
          fecha,
          hora,
          disponible
         FROM disponibilidad
         ORDER BY fecha ASC, dia_semana ASC, hora ASC`
      );

      res.json({
        success: true,
        disponibilidad: rows
      });
    } catch (error) {
      console.error(
        '❌ Error al obtener disponibilidad:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'No se pudo obtener la disponibilidad'
      });
    }
  }
);

router.post(
  '/disponibilidad',
  requireAdmin,
  async (req, res) => {
    try {
      const {
        dia_semana,
        fecha,
        hora,
        disponible
      } = req.body;

      if (
        dia_semana === undefined ||
        hora === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'dia_semana y hora son obligatorios'
        });
      }

      // Solo existe disponibilidad por fecha concreta: no se admiten
      // horarios semanales (fecha NULL).
      if (!esFechaValida(fecha)) {
        return res.status(400).json({
          success: false,
          message: 'fecha es obligatoria y debe tener formato YYYY-MM-DD'
        });
      }

      const dia = Number(dia_semana);

      if (
        Number.isNaN(dia) ||
        dia < 0 ||
        dia > 6
      ) {
        return res.status(400).json({
          success: false,
          message: 'dia_semana debe estar entre 0 y 6'
        });
      }

      const horaSql =
        hora.length === 5
          ? `${hora}:00`
          : hora;

      const disponibleFlag =
        disponible === undefined
          ? 1
          : Number(disponible)
            ? 1
            : 0;

      try {
        await db.execute(
          `INSERT INTO disponibilidad
           (dia_semana, fecha, hora, disponible)
           VALUES (?, ?, ?, ?)`,
          [
            dia,
            fecha,
            horaSql,
            disponibleFlag
          ]
        );
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un slot para ese día y hora'
          });
        }

        throw err;
      }

      res.status(201).json({
        success: true,
        message: 'Slot agregado'
      });
    } catch (error) {
      console.error(
        '❌ Error al crear disponibilidad:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'No se pudo crear el slot'
      });
    }
  }
);

router.patch(
  '/disponibilidad/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        dia_semana,
        hora,
        disponible
      } = req.body;

      const updates = [];
      const values = [];

      if (dia_semana !== undefined) {
        const dia = Number(dia_semana);

        if (
          Number.isNaN(dia) ||
          dia < 0 ||
          dia > 6
        ) {
          return res.status(400).json({
            success: false,
            message: 'dia_semana debe estar entre 0 y 6'
          });
        }

        updates.push('dia_semana = ?');
        values.push(dia);
      }

      if (hora !== undefined) {
        const horaSql =
          hora.length === 5
            ? `${hora}:00`
            : hora;

        updates.push('hora = ?');
        values.push(horaSql);
      }

      if (disponible !== undefined) {
        updates.push('disponible = ?');
        values.push(
          Number(disponible)
            ? 1
            : 0
        );
      }

      if (!updates.length) {
        return res.status(400).json({
          success: false,
          message: 'No hay campos para actualizar'
        });
      }

      values.push(id);

      await db.execute(
        `UPDATE disponibilidad
         SET ${updates.join(', ')}
         WHERE id = ?`,
        values
      );

      res.json({
        success: true,
        message: 'Slot actualizado'
      });
    } catch (error) {
      console.error(
        '❌ Error al actualizar disponibilidad:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'No se pudo actualizar el slot'
      });
    }
  }
);

router.delete(
  '/disponibilidad/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      await db.execute(
        'DELETE FROM disponibilidad WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Slot eliminado'
      });
    } catch (error) {
      console.error(
        '❌ Error al eliminar disponibilidad:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'No se pudo eliminar el slot'
      });
    }
  }
);

module.exports = router;
