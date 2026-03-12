const estados = ['pendiente', 'confirmada', 'completada', 'cancelada'];

// Variables de ordenamiento
let currentSort = { field: 'fecha_reserva', direction: 'desc' };
let allReservas = [];
let autoSaveTimeout = {};

function showMessage(text, type = 'success') {
  const el = document.getElementById('panelMessage');
  if (!el) return;
  el.textContent = text;
  el.className = `message show ${type}`;
  setTimeout(() => { el.className = 'message'; }, 3500);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include" // 🔥 OBLIGATORIO
  });
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

// ============================================
// ORDENAMIENTO DE TABLA
// ============================================
function setupSortHeaders() {
  const headers = document.querySelectorAll('.reservas-table th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.dataset.sort;
      
      // Si es el mismo campo, cambiar dirección
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'desc'; // Por defecto descendente para fechas
      }
      
      // Actualizar estilos de headers
      document.querySelectorAll('.reservas-table th.sortable').forEach(h => {
        h.classList.remove('asc', 'desc');
      });
      header.classList.add(currentSort.direction);
      
      // Re-renderizar tabla ordenada
      renderReservas(sortReservas([...allReservas]));
    });
  });
}

function sortReservas(reservas) {
  const sorted = [...reservas].sort((a, b) => {
    let aVal = a[currentSort.field];
    let bVal = b[currentSort.field];
    
    // Manejo especial para fechas
    if (currentSort.field === 'fecha_reserva' || currentSort.field === 'hora_reserva') {
      aVal = new Date(a.fecha_reserva + ' ' + (a.hora_reserva || '00:00'));
      bVal = new Date(b.fecha_reserva + ' ' + (b.hora_reserva || '00:00'));
    }
    
    // Comparación numérica o string
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
      return currentSort.direction === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      return currentSort.direction === 'asc' 
        ? aVal - bVal 
        : bVal - aVal;
    }
  });
  
  return sorted;
}

// ============================================
// RENDERIZACIÓN DE RESERVAS EN TABLA
// ============================================
function renderReservas(reservas) {
  allReservas = reservas;
  const tbody = document.getElementById('reservasBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  if (reservas.length === 0) {
    const emptyRow = tbody.insertRow();
    const emptyCell = emptyRow.insertCell(0);
    emptyCell.colSpan = 9;
    emptyCell.className = 'empty-state';
    emptyCell.textContent = '📭 No hay reservas registradas';
    return;
  }

  reservas.forEach((r) => {
    const tr = tbody.insertRow();
    tr.dataset.reservaId = r.id;

    // Cliente
    const cellCliente = tr.insertCell(0);
    cellCliente.className = 'client-cell';
    cellCliente.textContent = r.nombre;

    // Teléfono
    const cellPhone = tr.insertCell(1);
    cellPhone.textContent = r.telefono;

    // Email
    const cellEmail = tr.insertCell(2);
    cellEmail.textContent = r.email;

    // Fecha
    const cellFecha = tr.insertCell(3);
    const fechaFormato = new Date(r.fecha_reserva).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    cellFecha.textContent = fechaFormato;

    // Hora
    const cellHora = tr.insertCell(4);
    cellHora.textContent = r.hora_reserva?.slice(0, 5) || 'N/A';

    // Tipo de masaje
    const cellTipo = tr.insertCell(5);
    cellTipo.textContent = r.tipo_masaje;

    // Estado (select) - Con guardado automático
    const cellEstado = tr.insertCell(6);
    cellEstado.className = 'estado-cell';
    const selectEstado = document.createElement('select');
    selectEstado.dataset.reserva = r.id;
    selectEstado.className = 'reserva-select';
    estados.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e;
      opt.textContent = e.charAt(0).toUpperCase() + e.slice(1);
      if (r.estado === e) opt.selected = true;
      selectEstado.appendChild(opt);
    });
    // Auto-guardar al cambiar estado
    selectEstado.addEventListener('change', (e) => handleAutoSave(r.id, 'estado', e.target.value));
    cellEstado.appendChild(selectEstado);

    // Notas (textarea) - Con guardado automático
    const cellNotas = tr.insertCell(7);
    const textareaNotas = document.createElement('textarea');
    textareaNotas.dataset.reserva = r.id;
    textareaNotas.className = 'reserva-textarea';
    textareaNotas.placeholder = 'Notas internas…';
    textareaNotas.value = r.notas || '';
    // Auto-guardar al escribir
    textareaNotas.addEventListener('input', (e) => {
      handleAutoSave(r.id, 'notas', e.target.value);
    });
    cellNotas.appendChild(textareaNotas);

    // Menú de acciones
    const cellAcciones = tr.insertCell(8);
    cellAcciones.className = 'reservas-table-actions';
    
    const btnMenu = document.createElement('button');
    btnMenu.textContent = '⋮';
    btnMenu.className = 'btn-menu-actions';
    btnMenu.type = 'button';
    btnMenu.dataset.reserva = r.id;
    btnMenu.addEventListener('click', (e) => openActionsMenu(e, r));
    
    cellAcciones.appendChild(btnMenu);
  });
}

// ============================================
// GUARDADO AUTOMÁTICO
// ============================================
async function handleAutoSave(reservaId, field, value) {
  // Limpiar timeout anterior si existe
  if (autoSaveTimeout[reservaId]) {
    clearTimeout(autoSaveTimeout[reservaId]);
  }

  // Establecer nuevo timeout para guardar (esperar 1.5 segundos después del último cambio)
  autoSaveTimeout[reservaId] = setTimeout(async () => {
    const payload = {};
    
    if (field === 'estado') {
      payload.estado = value;
      // Obtener las notas actuales también
      const row = document.querySelector(`tr[data-reserva-id="${reservaId}"]`);
      if (row) {
        const textarea = row.querySelector('.reserva-textarea');
        payload.notas = textarea.value.trim();
      }
    } else if (field === 'notas') {
      payload.notas = value.trim();
      // Obtener el estado actual también
      const row = document.querySelector(`tr[data-reserva-id="${reservaId}"]`);
      if (row) {
        const select = row.querySelector('.reserva-select');
        payload.estado = select.value;
      }
    }

    const data = await fetchJson(`/api/admin/reservas/${reservaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (data?.success) {
      // Mostrar indicador de guardado (opcional)
      const row = document.querySelector(`tr[data-reserva-id="${reservaId}"]`);
      if (row) {
        row.classList.add('saving');
        setTimeout(() => row.classList.remove('saving'), 1000);
      }
    } else {
      showMessage(data?.message || 'Error al guardar', 'error');
    }
  }, 1500); // Esperar 1.5 segundos
}

// ============================================
// MENÚ DE ACCIONES DESPLEGABLE
// ============================================
function openActionsMenu(event, reserva) {
  event.stopPropagation();
  
  // Cerrar menús abiertos
  document.querySelectorAll('.actions-dropdown').forEach(menu => {
    menu.remove();
  });

  const menu = document.createElement('div');
  menu.className = 'actions-dropdown';
  menu.innerHTML = `
    <button class="action-item" data-action="modify-customer">👤 Modificar cliente</button>
    <button class="action-item" data-action="modify-date">📅 Modificar fecha</button>
    <button class="action-item" data-action="modify-time">🕐 Modificar hora</button>
    <button class="action-item delete" data-action="delete">🗑 Eliminar reserva</button>
  `;

  // Añadir al lado del botón
  event.target.parentElement.style.position = 'relative';
  event.target.parentElement.appendChild(menu);

  // Agregar event listeners
  menu.querySelectorAll('.action-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      menu.remove();
      handleActionClick(action, reserva);
    });
  });

  // Cerrar al hacer click fuera
  setTimeout(() => {
    document.addEventListener('click', () => {
      menu.remove();
    }, { once: true });
  }, 0);
}

function handleActionClick(action, reserva) {
  switch(action) {
    case 'modify-customer':
      openCustomerModal(reserva);
      break;
    case 'modify-date':
      openDateModal(reserva);
      break;
    case 'modify-time':
      openTimeModal(reserva);
      break;
    case 'delete':
      handleEliminarReserva(reserva.id);
      break;
  }
}

// ============================================
// MODALES PARA EDITAR DATOS
// ============================================
function openCustomerModal(reserva) {
  const modal = document.createElement('div');
  modal.className = 'modal modal-form show';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">×</button>
      <h2>✏️ Modificar datos del cliente</h2>
      <form class="form-grid" style="margin-top: 20px;">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" value="${reserva.nombre}" id="editNombre">
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="tel" value="${reserva.telefono}" id="editTelefono">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" value="${reserva.email}" id="editEmail">
        </div>
        <button type="button" class="btn-primary" id="saveCustomerBtn">Guardar cambios</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveCustomerBtn').addEventListener('click', async () => {
    const data = await fetchJson(`/api/admin/reservas/${reserva.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: document.getElementById('editNombre').value,
        telefono: document.getElementById('editTelefono').value,
        email: document.getElementById('editEmail').value
      })
    });
    
    if (data?.success) {
      showMessage('✓ Datos del cliente actualizados', 'success');
      modal.remove();
      await cargarReservas();
    } else {
      showMessage('Error al actualizar', 'error');
    }
  });
}

function openDateModal(reserva) {
  const modal = document.createElement('div');
  modal.className = 'modal modal-form show';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">×</button>
      <h2>📅 Modificar fecha</h2>
      <form class="form-grid" style="margin-top: 20px;">
        <div class="form-group">
          <label>Nueva fecha</label>
          <input type="date" value="${reserva.fecha_reserva}" id="editFecha">
        </div>
        <button type="button" class="btn-primary" id="saveDateBtn">Guardar cambios</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveDateBtn').addEventListener('click', async () => {
    const data = await fetchJson(`/api/admin/reservas/${reserva.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_reserva: document.getElementById('editFecha').value })
    });
    
    if (data?.success) {
      showMessage('✓ Fecha actualizada', 'success');
      modal.remove();
      await cargarReservas();
    } else {
      showMessage('Error al actualizar', 'error');
    }
  });
}

function openTimeModal(reserva) {
  const modal = document.createElement('div');
  modal.className = 'modal modal-form show';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">×</button>
      <h2>🕐 Modificar hora</h2>
      <form class="form-grid" style="margin-top: 20px;">
        <div class="form-group">
          <label>Nueva hora</label>
          <input type="time" value="${reserva.hora_reserva?.slice(0, 5) || ''}" id="editHora">
        </div>
        <button type="button" class="btn-primary" id="saveTimeBtn">Guardar cambios</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveTimeBtn').addEventListener('click', async () => {
    const data = await fetchJson(`/api/admin/reservas/${reserva.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hora_reserva: document.getElementById('editHora').value + ':00' })
    });
    
    if (data?.success) {
      showMessage('✓ Hora actualizada', 'success');
      modal.remove();
      await cargarReservas();
    } else {
      showMessage('Error al actualizar', 'error');
    }
  });
}

async function handleEliminarReserva(reservaId) {
  if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar esta reserva?')) {
    return;
  }

  const row = document.querySelector(`tr[data-reserva-id="${reservaId}"]`);
  
  const data = await fetchJson(`/api/admin/reservas/${reservaId}`, { method: 'DELETE' });

  if (data?.success) {
    if (row) {
      row.style.opacity = '0';
      row.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        row.remove();
        showMessage('✓ Reserva eliminada correctamente', 'success');
      }, 300);
    }
  } else {
    showMessage(data?.message || 'No se pudo eliminar la reserva', 'error');
  }
}

// ============================================
// CARGAR DATOS
// ============================================
async function cargarReservas() {
  const data = await fetchJson('/api/admin/reservas');
  if (data?.success) {
    const reservasOrdenadas = sortReservas(data.reservas || []);
    renderReservas(reservasOrdenadas);
    setupSortHeaders();
  } else {
    showMessage(data?.message || 'No se pudieron cargar las reservas', 'error');
  }
}

// ============================================
// RENDERIZACIÓN DE DISPONIBILIDAD
// ============================================
function renderDisponibilidad(slots) {
  const container = document.getElementById('disponibilidadContainer');
  if (!container) return;
  
  container.innerHTML = '';

  if (slots.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; padding: 40px 20px; text-align: center; color: var(--text-light);">No hay horarios de disponibilidad registrados. Añade uno nuevo para comenzar.</div>';
    return;
  }

  slots.forEach((slot) => {
    const card = document.createElement('div');
    card.className = 'slot-card';

    const diasNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let nombreDia;
    if (slot.fecha) {
      // MySQL puede devolver Date object o string YYYY-MM-DD
      const raw = typeof slot.fecha === 'string' ? slot.fecha.slice(0, 10) : slot.fecha.toISOString().slice(0, 10);
      const [y, m, d] = raw.split('-').map(Number);
      const fecha = new Date(y, m - 1, d); // sin zona horaria
      const weekday = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      const dateStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      nombreDia = weekday.charAt(0).toUpperCase() + weekday.slice(1) + ', ' + dateStr;
    } else {
      nombreDia = diasNombre[slot.dia_semana] || slot.dia_semana;
    }

    card.innerHTML = `
      <div class="slot-info">
        <div class="slot-fecha">${nombreDia}</div>
        <div class="slot-meta">
          <span>🕐 ${slot.hora.slice(0,5)}</span>
          <span class="slot-status ${slot.disponible ? 'disponible' : 'no-disponible'}">
            ${slot.disponible ? '✓ Disponible' : '✗ No disponible'}
          </span>
        </div>
      </div>
      <div class="slot-acciones">
        <button class="btn-toggle" data-slot="${slot.id}">
          ${slot.disponible ? '👁 Marcar no disp.' : '👁 Marcar disp.'}
        </button>
        <button class="btn-eliminar-slot" data-slot="${slot.id}">Eliminar</button>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', handleToggleDisponibilidad);
  });

  container.querySelectorAll('.btn-eliminar-slot').forEach(btn => {
    btn.addEventListener('click', handleEliminarSlot);
  });
}

async function handleToggleDisponibilidad(event) {
  const btn = event.target;
  const slotId = btn.dataset.slot;
  
  const card = btn.closest('.slot-card');
  const statusElement = card.querySelector('.slot-status');
  const esDisponible = statusElement.classList.contains('disponible');

  btn.disabled = true;

  const data = await fetchJson(`/api/admin/disponibilidad/${slotId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disponible: esDisponible ? 0 : 1 })
  });

  if (data?.success) {
    showMessage('✓ Disponibilidad actualizada', 'success');
    await cargarDisponibilidad();
  } else {
    showMessage(data?.message || 'No se pudo actualizar la disponibilidad', 'error');
    btn.disabled = false;
  }
}

async function handleEliminarSlot(event) {
  const btn = event.target;
  const slotId = btn.dataset.slot;

  if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este horario?')) {
    return;
  }

  btn.disabled = true;
  const card = btn.closest('.slot-card');

  const data = await fetchJson(`/api/admin/disponibilidad/${slotId}`, { method: 'DELETE' });

  if (data?.success) {
    card.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      card.remove();
      showMessage('✓ Horario eliminado correctamente', 'success');
    }, 300);
  } else {
    showMessage(data?.message || 'No se pudo eliminar el horario', 'error');
    btn.disabled = false;
  }
}

async function cargarDisponibilidad() {
  const data = await fetchJson('/api/admin/disponibilidad');
  if (data?.success) {
    renderDisponibilidad(data.disponibilidad || []);
  } else {
    showMessage(data?.message || 'No se pudo cargar la disponibilidad', 'error');
  }
}

// ============================================
// FORMULARIO DE DISPONIBILIDAD (ACORDEÓN)
// ============================================
function toggleFormularioDisponibilidad() {
  const formContainer = document.getElementById('slotFormContainer');
  if (formContainer) {
    formContainer.classList.toggle('show');
    if (formContainer.classList.contains('show')) {
      document.getElementById('fecha_disponibilidad')?.focus();
    }
  }
}

function cerrarFormularioDisponibilidad() {
  const formContainer = document.getElementById('slotFormContainer');
  if (formContainer) {
    formContainer.classList.remove('show');
  }
}

async function agregarSlot(event) {
  event.preventDefault();
  const form = document.getElementById('slotForm');
  if (!form) return;

  const fechaInput = form.fecha_disponibilidad.value;
  const hora = form.hora.value;
  const disponible = form.disponible.value;

  if (!fechaInput || !hora) {
    showMessage('Por favor completa todos los campos', 'warning');
    return;
  }

  const fecha = new Date(fechaInput);
  const diaSemana = fecha.getDay();

  const payload = {
    dia_semana: diaSemana,
    fecha: fechaInput,
    hora,
    disponible: Number(disponible)
  };

  const data = await fetchJson('/api/admin/disponibilidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (data?.success) {
    showMessage('✓ Horario añadido correctamente', 'success');
    form.reset();
    cerrarFormularioDisponibilidad();
    await cargarDisponibilidad();
  } else {
    showMessage(data?.message || 'No se pudo crear el horario', 'error');
  }
}

// ============================================
// AUTENTICACIÓN
// ============================================
async function logout() {
  await fetchJson('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
}

function openPasswordModal() {
  const modal = document.getElementById('passwordModal');
  if (modal) {
    modal.classList.add('show');
    document.getElementById('currentPassword')?.focus();
  }
}

function closePasswordModal() {
  const modal = document.getElementById('passwordModal');
  if (modal) modal.classList.remove('show');
  const form = document.getElementById('passwordForm');
  if (form) form.reset();
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

  if (newPassword !== newPasswordConfirm) {
    showPasswordMessage('Las contraseñas no coinciden', 'error');
    return;
  }

  try {
    const data = await fetchJson('/api/admin/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm })
    });

    if (data?.success) {
      showPasswordMessage('✓ Contraseña actualizada correctamente', 'success');
      setTimeout(() => { closePasswordModal(); }, 1500);
    } else {
      showPasswordMessage(data?.message || 'No se pudo cambiar la contraseña', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showPasswordMessage('Error al cambiar la contraseña', 'error');
  }
}

function showPasswordMessage(text, type = 'success') {
  const el = document.getElementById('passwordMessage');
  if (!el) return;
  el.textContent = text;
  el.className = `message show ${type}`;
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  await ensureAuth();
  await Promise.all([cargarReservas(), cargarDisponibilidad()]);

  // Header buttons
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const changePassBtn = document.getElementById('changePassBtn');
  if (changePassBtn) changePassBtn.addEventListener('click', openPasswordModal);

  // Password modal
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);

  // Formulario de disponibilidad
  const toggleFormBtn = document.getElementById('toggleFormBtn');
  if (toggleFormBtn) toggleFormBtn.addEventListener('click', toggleFormularioDisponibilidad);

  const cancelFormBtn = document.getElementById('cancelFormBtn');
  if (cancelFormBtn) cancelFormBtn.addEventListener('click', cerrarFormularioDisponibilidad);

  const slotForm = document.getElementById('slotForm');
  if (slotForm) slotForm.addEventListener('submit', agregarSlot);

  // Cerrar modal con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePasswordModal();
    }
  });

  // Hacer columnas redimensionables
  makeColumnsResizable();
});

// ============================================
// COLUMNAS REDIMENSIONABLES
// ============================================
function makeColumnsResizable() {
  const table = document.querySelector('.reservas-table');
  if (!table) return;

  const headers = table.querySelectorAll('th');
  headers.forEach((header, index) => {
    const resizer = document.createElement('div');
    resizer.className = 'column-resizer';
    header.appendChild(resizer);
    
    let startX, startWidth;
    
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startX = e.pageX;
      startWidth = header.offsetWidth;
      
      const onMouseMove = (e) => {
        const width = startWidth + (e.pageX - startX);
        header.style.width = width + 'px';
        header.style.minWidth = width + 'px';
        
        // Aplicar mismo ancho a todas las celdas de esa columna
        const cells = table.querySelectorAll(`td:nth-child(${index + 1})`);
        cells.forEach(cell => {
          cell.style.width = width + 'px';
          cell.style.minWidth = width + 'px';
        });
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });
}

