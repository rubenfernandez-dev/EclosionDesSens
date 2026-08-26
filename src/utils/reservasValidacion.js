// Catálogo canónico de tipos de masaje: extraído literalmente de las <option>
// del formulario público (src/public/reservas.html, #tipo_masaje).
const TIPOS_MASAJE_VALIDOS = [
  'Masaje Clásico Completo (75 min)',
  'Masaje Clásico Espalda Nuca (50 min)',
  'Masaje Deportivo  (45 min)',
  'Masaje Combinado (90 min)'
];

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:00)?$/;

const ZONA_HORARIA_NEGOCIO = 'Europe/Zurich';
const formatterZurich = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_NEGOCIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !FECHA_REGEX.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  // Descarta desbordes de calendario (p.ej. 2024-02-30 -> 2024-03-01)
  return d.toISOString().slice(0, 10) === fecha;
}

/**
 * Fecha y hora actuales en la zona horaria del negocio (Europe/Zurich),
 * independientemente de la zona horaria del sistema operativo del servidor.
 * Usa Intl.DateTimeFormat (soporte nativo de Node, sin dependencias nuevas).
 */
function obtenerAhoraNegocio(instante = new Date()) {
  const partes = Object.fromEntries(
    formatterZurich.formatToParts(instante).map(p => [p.type, p.value])
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    hora: `${partes.hour}:${partes.minute}:${partes.second}`
  };
}

/**
 * Reglas (hora de negocio, Europe/Zurich):
 * - fecha anterior a hoy -> false
 * - hoy y hora <= hora actual -> false
 * - hoy y hora futura -> true
 * - fecha futura -> true
 * La comparación es por string porque fecha ('YYYY-MM-DD') y horaNormalizada
 * ('HH:MM:SS') tienen ancho fijo y orden lexicográfico == orden cronológico.
 */
function esFechaHoraFutura(fecha, horaNormalizada, ahora = obtenerAhoraNegocio()) {
  if (fecha < ahora.fecha) return false;
  if (fecha === ahora.fecha && horaNormalizada <= ahora.hora) return false;
  return true;
}

function esHoraValida(hora) {
  return typeof hora === 'string' && HORA_REGEX.test(hora);
}

function normalizarHora(hora) {
  return hora.length === 5 ? `${hora}:00` : hora;
}

function esTipoMasajeValido(tipo) {
  return TIPOS_MASAJE_VALIDOS.includes(tipo);
}

/**
 * Resuelve si hay disponibilidad efectiva para una fecha+hora dadas.
 * Precedencia: una excepción puntual (fecha específica) para esa hora
 * prevalece sobre el slot recurrente (fecha NULL) del mismo día de semana.
 * `filas` son las filas ya obtenidas de la tabla `disponibilidad` que
 * coinciden con (fecha = fecha) OR (fecha IS NULL AND dia_semana = diaSemana).
 */
function resolverDisponibilidad(filas, horaNormalizada) {
  const excepcion = filas.find(f => f.fecha !== null && String(f.hora).slice(0, 8) === horaNormalizada);
  if (excepcion) {
    return excepcion.disponible === 1 || excepcion.disponible === true;
  }
  const recurrente = filas.find(f => f.fecha === null && String(f.hora).slice(0, 8) === horaNormalizada);
  if (recurrente) {
    return recurrente.disponible === 1 || recurrente.disponible === true;
  }
  return false;
}

module.exports = {
  TIPOS_MASAJE_VALIDOS,
  ZONA_HORARIA_NEGOCIO,
  esFechaValida,
  obtenerAhoraNegocio,
  esFechaHoraFutura,
  esHoraValida,
  normalizarHora,
  esTipoMasajeValido,
  resolverDisponibilidad
};
