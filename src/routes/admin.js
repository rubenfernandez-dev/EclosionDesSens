const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/db');

function requireAdmin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'No autorizado' });
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña son obligatorios' });
    }

    const [rows] = await db.execute(
      'SELECT id, username, password_hash, role FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ success: true, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error('❌ Error en login admin:', error);
    res.status(500).json({ success: false, message: 'Error en el inicio de sesión' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(process.env.SESSION_NAME || 'eds.sid');
    res.json({ success: true });
  });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, user: req.session.user });
});

router.patch('/me/password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    const userId = req.session.user.id;

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({ success: false, message: 'Las contraseñas nuevas no coinciden' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const [rows] = await db.execute(
      'SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({ success: false, message: 'No se pudo cambiar la contraseña' });
  }
});


router.get('/reservas', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nombre, telefono, email, fecha_reserva, hora_reserva, tipo_masaje, estado, notas, mensaje, created_at
       FROM reservas
       ORDER BY fecha_reserva DESC, hora_reserva DESC`
    );
    res.json({ success: true, reservas: rows });
  } catch (error) {
    console.error('❌ Error al obtener reservas:', error);
    res.status(500).json({ success: false, message: 'No se pudo obtener las reservas' });
  }
});

router.patch('/reservas/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const updates = [];
    const values = [];

    if (estado) {
      updates.push('estado = ?');
      values.push(estado);
    }
    if (notas !== undefined) {
      updates.push('notas = ?');
      values.push(notas || null);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    await db.execute(`UPDATE reservas SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Reserva actualizada' });
  } catch (error) {
    console.error('❌ Error al actualizar reserva:', error);
    res.status(500).json({ success: false, message: 'No se pudo actualizar la reserva' });
  }
});

router.delete('/reservas/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM reservas WHERE id = ?', [id]);
    res.json({ success: true, message: 'Reserva eliminada' });
  } catch (error) {
    console.error('❌ Error al eliminar reserva:', error);
    res.status(500).json({ success: false, message: 'No se pudo eliminar la reserva' });
  }
});

router.get('/disponibilidad', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, dia_semana, hora, disponible FROM disponibilidad ORDER BY dia_semana ASC, hora ASC'
    );
    res.json({ success: true, disponibilidad: rows });
  } catch (error) {
    console.error('❌ Error al obtener disponibilidad:', error);
    res.status(500).json({ success: false, message: 'No se pudo obtener la disponibilidad' });
  }
});

router.post('/disponibilidad', requireAdmin, async (req, res) => {
  try {
    const { dia_semana, hora, disponible } = req.body;

    if (dia_semana === undefined || hora === undefined) {
      return res.status(400).json({ success: false, message: 'dia_semana y hora son obligatorios' });
    }

    const dia = Number(dia_semana);
    if (Number.isNaN(dia) || dia < 0 || dia > 6) {
      return res.status(400).json({ success: false, message: 'dia_semana debe estar entre 0 y 6' });
    }

    const horaSql = hora.length === 5 ? `${hora}:00` : hora;
    const disponibleFlag = disponible === undefined ? 1 : Number(disponible) ? 1 : 0;

    try {
      await db.execute(
        'INSERT INTO disponibilidad (dia_semana, hora, disponible) VALUES (?, ?, ?)',
        [dia, horaSql, disponibleFlag]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Ya existe un slot para ese día y hora' });
      }
      throw err;
    }

    res.status(201).json({ success: true, message: 'Slot agregado' });
  } catch (error) {
    console.error('❌ Error al crear disponibilidad:', error);
    res.status(500).json({ success: false, message: 'No se pudo crear el slot' });
  }
});

router.patch('/disponibilidad/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dia_semana, hora, disponible } = req.body;

    const updates = [];
    const values = [];

    if (dia_semana !== undefined) {
      const dia = Number(dia_semana);
      if (Number.isNaN(dia) || dia < 0 || dia > 6) {
        return res.status(400).json({ success: false, message: 'dia_semana debe estar entre 0 y 6' });
      }
      updates.push('dia_semana = ?');
      values.push(dia);
    }

    if (hora !== undefined) {
      const horaSql = hora.length === 5 ? `${hora}:00` : hora;
      updates.push('hora = ?');
      values.push(horaSql);
    }

    if (disponible !== undefined) {
      updates.push('disponible = ?');
      values.push(Number(disponible) ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    await db.execute(`UPDATE disponibilidad SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Slot actualizado' });
  } catch (error) {
    console.error('❌ Error al actualizar disponibilidad:', error);
    res.status(500).json({ success: false, message: 'No se pudo actualizar el slot' });
  }
});

router.delete('/disponibilidad/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM disponibilidad WHERE id = ?', [id]);
    res.json({ success: true, message: 'Slot eliminado' });
  } catch (error) {
    console.error('❌ Error al eliminar disponibilidad:', error);
    res.status(500).json({ success: false, message: 'No se pudo eliminar el slot' });
  }
});

module.exports = router;
