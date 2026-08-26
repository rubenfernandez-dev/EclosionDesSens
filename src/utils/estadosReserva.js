// Fuente única de verdad para los estados de reserva realmente usados por el panel admin
// (ver src/public/js/admin-dashboard.js, array `estados`).
const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'completada', 'cancelada'];

// Todos menos 'cancelada' ocupan el hueco (semántica ya implícita en el filtro
// `estado != "cancelada"` que usaba la comprobación de conflictos original).
const ESTADOS_QUE_BLOQUEAN = ['pendiente', 'confirmada', 'completada'];

function esEstadoValido(estado) {
  return ESTADOS_VALIDOS.includes(estado);
}

function bloqueaHueco(estado) {
  return ESTADOS_QUE_BLOQUEAN.includes(estado);
}

module.exports = {
  ESTADOS_VALIDOS,
  ESTADOS_QUE_BLOQUEAN,
  esEstadoValido,
  bloqueaHueco
};
