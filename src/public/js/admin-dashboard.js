const estados = ['pendiente', 'confirmada', 'completada', 'cancelada'];
const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function showMessage(text, type = 'success') {
  const el = document.getElementById('panelMessage');
  if (!el) return;
  el.textContent = text;
  el.className = `message show ${type}`;
  setTimeout(() => { el.className = 'message'; }, 3200);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = '/admin/login.html';
    return null;
  }
  const data = await res.json();
  return data;
}

async function ensureAuth() {
  const data = await fetchJson('/api/admin/me');
  if (data && data.success && data.user) {
    const tag = document.getElementById('userTag');
    if (tag) tag.textContent = `${data.user.username} · ${data.user.role}`;
  }
}

function renderReservas(reservas) {
  const tbody = document.getElementById('reservasBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  reservas.forEach((r) => {
    const tr = document.createElement('tr');

    const fechaTexto = `${r.fecha_reserva} ${r.hora_reserva?.slice(0,5) || ''}`;

    tr.innerHTML = `
      <td>
        <strong>${r.nombre}</strong><br>
        <span class="small">${r.telefono} · ${r.email}</span>
      </td>
      <td>${fechaTexto}</td>
      <td>${r.tipo_masaje}</td>
      <td></td>
      <td></td>
      <td class="actions"></td>
    `;

    const estadoCell = tr.children[3];
    const notasCell = tr.children[4];
    const actionsCell = tr.children[5];

    const select = document.createElement('select');
    estados.forEach((e) => {
      const opt = document.createElement('option');
      opt.value = e;
      opt.textContent = e.charAt(0).toUpperCase() + e.slice(1);
      if (r.estado === e) opt.selected = true;
      select.appendChild(opt);
    });
    estadoCell.appendChild(select);

    const notas = document.createElement('textarea');
    notas.value = r.notas || '';
    notas.placeholder = 'Notas internas';
    notasCell.appendChild(notas);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar';
    saveBtn.className = 'btn';
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      const payload = { estado: select.value, notas: notas.value.trim() };
      const data = await fetchJson(`/api/admin/reservas/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (data?.success) showMessage('Reserva actualizada');
      else showMessage(data?.message || 'No se pudo actualizar', 'error');
      saveBtn.disabled = false;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.className = 'btn';
    deleteBtn.type = 'button';
    deleteBtn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
    deleteBtn.style.color = '#fff';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta reserva?')) return;
      deleteBtn.disabled = true;
      const data = await fetchJson(`/api/admin/reservas/${r.id}`, { method: 'DELETE' });
      if (data?.success) {
        tr.remove();
        showMessage('Reserva eliminada');
      } else {
        showMessage(data?.message || 'No se pudo eliminar', 'error');
      }
      deleteBtn.disabled = false;
    });

    actionsCell.appendChild(saveBtn);
    actionsCell.appendChild(deleteBtn);
    tbody.appendChild(tr);
  });
}

function renderDisponibilidad(slots) {
  const tbody = document.getElementById('disponibilidadBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  slots.forEach((slot) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dias[slot.dia_semana] || slot.dia_semana}</td>
      <td>${slot.hora.slice(0,5)}</td>
      <td>${slot.disponible ? 'Sí' : 'No'}</td>
      <td class="actions"></td>
    `;

    const actions = tr.children[3];

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = slot.disponible ? 'Marcar no disponible' : 'Marcar disponible';
    toggleBtn.className = 'btn';
    toggleBtn.type = 'button';
    toggleBtn.addEventListener('click', async () => {
      toggleBtn.disabled = true;
      const data = await fetchJson(`/api/admin/disponibilidad/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: slot.disponible ? 0 : 1 })
      });
      if (data?.success) {
        showMessage('Disponibilidad actualizada');
        await cargarDisponibilidad();
      } else {
        showMessage(data?.message || 'No se pudo actualizar', 'error');
      }
      toggleBtn.disabled = false;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.className = 'btn';
    deleteBtn.type = 'button';
    deleteBtn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
    deleteBtn.style.color = '#fff';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este slot?')) return;
      deleteBtn.disabled = true;
      const data = await fetchJson(`/api/admin/disponibilidad/${slot.id}`, { method: 'DELETE' });
      if (data?.success) {
        tr.remove();
        showMessage('Slot eliminado');
      } else {
        showMessage(data?.message || 'No se pudo eliminar', 'error');
      }
      deleteBtn.disabled = false;
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
    tbody.appendChild(tr);
  });
}

async function cargarReservas() {
  const data = await fetchJson('/api/admin/reservas');
  if (data?.success) {
    renderReservas(data.reservas || []);
  } else {
    showMessage(data?.message || 'No se pudieron cargar reservas', 'error');
  }
}

async function cargarDisponibilidad() {
  const data = await fetchJson('/api/admin/disponibilidad');
  if (data?.success) {
    renderDisponibilidad(data.disponibilidad || []);
  } else {
    showMessage(data?.message || 'No se pudo cargar disponibilidad', 'error');
  }
}

async function agregarSlot(event) {
  event.preventDefault();
  const form = document.getElementById('slotForm');
  if (!form) return;
  const dia = form.dia_semana.value;
  const hora = form.hora.value;
  const disponible = form.disponible.value;

  const data = await fetchJson('/api/admin/disponibilidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dia_semana: Number(dia), hora, disponible: Number(disponible) })
  });

  if (data?.success) {
    showMessage('Slot agregado');
    form.reset();
    await cargarDisponibilidad();
  } else {
    showMessage(data?.message || 'No se pudo crear el slot', 'error');
  }
}

async function logout() {
  await fetchJson('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
}

function openPasswordModal() {
  const modal = document.getElementById('passwordModal');
  if (modal) modal.classList.add('show');
}

function closePasswordModal() {
  const modal = document.getElementById('passwordModal');
  if (modal) modal.classList.remove('show');
}

async function handlePasswordChange(event) {
  event.preventDefault();
  const form = document.getElementById('passwordForm');
  if (!form) return;

  const currentPassword = form.currentPassword.value;
  const newPassword = form.newPassword.value;
  const newPasswordConfirm = form.newPasswordConfirm.value;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    showPasswordMessage('Completa todos los campos', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showPasswordMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  try {
    const data = await fetchJson('/api/admin/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm })
    });

    if (data?.success) {
      showPasswordMessage('Contraseña actualizada correctamente', 'success');
      setTimeout(() => { closePasswordModal(); }, 1500);
      form.reset();
    } else {
      showPasswordMessage(data?.message || 'No se pudo cambiar la contraseña', 'error');
    }
  } catch (error) {
    console.error('Error', error);
    showPasswordMessage('Error al cambiar la contraseña', 'error');
  }
}

function showPasswordMessage(text, type = 'success') {
  const el = document.getElementById('passwordMessage');
  if (!el) return;
  el.textContent = text;
  el.className = `message show ${type}`;
}


document.addEventListener('DOMContentLoaded', async () => {
  await ensureAuth();
  await Promise.all([cargarReservas(), cargarDisponibilidad()]);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const changePassBtn = document.getElementById('changePassBtn');
  if (changePassBtn) changePassBtn.addEventListener('click', openPasswordModal);

  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);

  const slotForm = document.getElementById('slotForm');
  if (slotForm) slotForm.addEventListener('submit', agregarSlot);
});
