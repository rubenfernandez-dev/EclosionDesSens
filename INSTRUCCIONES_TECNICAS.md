## ⚙️ INSTRUCCIONES TÉCNICAS - ARCHIVOS ACTUALIZADOS

### 📋 RESUMEN DE CAMBIOS

Se han actualizado **3 archivos principales** del proyecto:

1. **dashboard.html** - Estructura HTML rediseñada
2. **admin-dashboard.css** - Nuevo archivo CSS (882 líneas)
3. **admin-dashboard.js** - Lógica JavaScript mejorada (390 líneas)

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
src/public/
├── admin/
│   └── dashboard.html ✓ (ACTUALIZADO)
├── css/
│   └── admin-dashboard.css ✓ (NUEVO)
├── js/
│   └── admin-dashboard.js ✓ (ACTUALIZADO)
```

---

## 🔧 CAMBIOS TÉCNICOS DETALLADOS

### 1. dashboard.html

#### Antes:
- HTML con estilos inline en `<style>`
- Tablas HTML para mostrar datos
- Formulario visible siempre para disponibilidad

#### Después:
- HTML limpio separado del CSS
- Contenedores `<div>` dinámicos para tarjetas
- Formulario en acordeón (hidden/show)
- Link a archivo CSS externo: `/css/admin-dashboard.css`

#### Elementos clave:
```html
<!-- Header sticky -->
<header class="admin-header">
  <div class="header-content">
    <div class="brand">
      <div class="brand-logo">ÉS</div>
      ...
    </div>
    ...
  </div>
</header>

<!-- Contenedor dinámico para reservas -->
<div class="reservas-container" id="reservasContainer"></div>

<!-- Acordeón para formulario -->
<div class="accordion-form" id="slotFormContainer">
  <form id="slotForm" class="form-grid">
    <div class="form-group">
      <label for="fecha_disponibilidad">📆 Selecciona fecha</label>
      <input type="date" id="fecha_disponibilidad" ...>
    </div>
    ...
  </form>
</div>

<!-- Contenedor para slots -->
<div id="disponibilidadContainer" class="slots-grid"></div>

<!-- Modal reutilizable -->
<div id="passwordModal" class="modal">...</div>
```

---

### 2. admin-dashboard.css (Nuevo archivo)

#### Estructura:
```
:root { variables CSS }
body { estilos base }
.admin-header { estilos header }
.btn-* { estilos botones }
.admin-main { contenedor principal }
.admin-section { secciones }
.reserva-card { tarjetas reservas }
.slot-card { tarjetas disponibilidad }
.accordion-form { formulario desplegable }
.modal { modal dialogs }
@media (max-width: 768px) { responsive }
@media (max-width: 480px) { mobile }
@keyframes { animaciones }
```

#### Variables CSS (Personalizables):
```css
:root {
  /* Colores */
  --primary-color: #8B6F47;      /* Cambiar aquí para nuevo color principal */
  --success-color: #7a9d7e;      /* Color botón guardar */
  --error-color: #c97d7d;        /* Color botón eliminar */
  
  /* Espaciado */
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  
  /* Sombras */
  --shadow-md: 0 4px 16px rgba(139, 111, 71, 0.12);
}
```

#### Clases principales:
- `.admin-header` - Header sticky con brand
- `.btn-primary` - Botón principal (marrón)
- `.btn-secondary` - Botón secundario (gris)
- `.admin-section` - Sección principal (fondo blanco)
- `.reserva-card` - Tarjeta individual de reserva
- `.slot-card` - Tarjeta individual de disponibilidad
- `.accordion-form` - Formulario que se abre/cierra
- `.modal` / `.modal.show` - Modal dialogs

---

### 3. admin-dashboard.js (Actualizado)

#### Nuevas funciones:

**Renderización:**
```javascript
renderReservas(reservas)         // Crea tarjetas HTML de reservas
renderDisponibilidad(slots)      // Crea tarjetas HTML de slots
```

**Manejo de Reservas:**
```javascript
handleGuardarReserva(event)      // Actualiza reserva (PATCH)
handleEliminarReserva(event)     // Elimina reserva (DELETE)
cargarReservas()                 // Obtiene datos del servidor
```

**Manejo de Disponibilidad:**
```javascript
handleToggleDisponibilidad(e)    // Cambia estado disponibilidad
handleEliminarSlot(event)        // Elimina un slot
cargarDisponibilidad()           // Obtiene datos del servidor
agregarSlot(event)               // Crea nuevo slot (POST)
```

**Formulario Acordeón:**
```javascript
toggleFormularioDisponibilidad() // Abre/cierra formulario
cerrarFormularioDisponibilidad() // Solo cierra
```

**Autenticación:**
```javascript
ensureAuth()                     // Verifica sesión al cargar
logout()                         // Cierra sesión
openPasswordModal()              // Abre modal de contraseña
closePasswordModal()             // Cierra modal
handlePasswordChange(event)      // Actualiza contraseña (PATCH)
```

#### Eventos principales:
```javascript
// Header
logoutBtn.addEventListener('click', logout)
changePassBtn.addEventListener('click', openPasswordModal)

// Disponibilidad
toggleFormBtn.addEventListener('click', toggleFormularioDisponibilidad)
cancelFormBtn.addEventListener('click', cerrarFormularioDisponibilidad)
slotForm.addEventListener('submit', agregarSlot)

// Modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePasswordModal()
})

// Reservas (dinámicas)
container.querySelectorAll('.btn-guardar').forEach(btn => {
  btn.addEventListener('click', handleGuardarReserva)
})
```

---

## 🔌 INTEGRACIÓN CON BACKEND

### APIs Utilizadas (Sin cambios):

```javascript
// GET - Obtener reservas
fetch('/api/admin/reservas')

// PATCH - Actualizar reserva
fetch(`/api/admin/reservas/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ estado, notas })
})

// DELETE - Eliminar reserva
fetch(`/api/admin/reservas/${id}`, { method: 'DELETE' })

// POST - Crear disponibilidad
fetch('/api/admin/disponibilidad', {
  method: 'POST',
  body: JSON.stringify({ dia_semana, fecha, hora, disponible })
})

// PATCH - Actualizar disponibilidad
fetch(`/api/admin/disponibilidad/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ disponible })
})

// DELETE - Eliminar disponibilidad
fetch(`/api/admin/disponibilidad/${id}`, { method: 'DELETE' })
```

### Cambios en Payload:

**Nuevo en disponibilidad:**
```javascript
// Ahora también envía:
{
  fecha: "2025-12-25",        // Nuevo: fecha exacta (YYYY-MM-DD)
  dia_semana: 5,              // Se calcula desde la fecha
  hora: "14:30",
  disponible: 1
}
```

---

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Móvil (< 480px) */
@media (max-width: 480px) {
  /* 1 columna, fuentes reducidas */
  grid-template-columns: 1fr;
}

/* Tablet (480px - 768px) */
@media (max-width: 768px) {
  /* 2 columnas, ajustes layout */
  grid-template-columns: 1fr;
}

/* Desktop (768px+) */
/* Grid multi-columna */
grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
```

---

## 🎨 PERSONALIZACIÓN RÁPIDA

### Cambiar color principal:
```css
:root {
  --primary-color: #B05032;  /* De marrón a tu color */
}
```

### Cambiar fuente:
```css
:root {
  --font-body: 'Nunito', sans-serif;  /* Nueva fuente */
}
```

### Aumentar espaciado:
```css
:root {
  --spacing-lg: 2.5rem;  /* De 2rem a 2.5rem */
}
```

### Cambiar sombra:
```css
:root {
  --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.15);  /* Más intensa */
}
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Copiar `admin-dashboard.css` a `/src/public/css/`
- [ ] Actualizar `dashboard.html` 
- [ ] Actualizar `admin-dashboard.js`
- [ ] Verificar que el server sirva `/css/admin-dashboard.css`
- [ ] Probar en navegador (Chrome, Firefox, Safari)
- [ ] Verificar responsive en móvil (DevTools)
- [ ] Probar todas las funciones:
  - [ ] Cargar reservas
  - [ ] Editar estado de reserva
  - [ ] Editar notas de reserva
  - [ ] Eliminar reserva
  - [ ] Desplegar formulario disponibilidad
  - [ ] Seleccionar fecha (calendario)
  - [ ] Crear nuevo slot
  - [ ] Toggle disponibilidad
  - [ ] Eliminar slot
  - [ ] Cambiar contraseña
  - [ ] Logout

---

## 🐛 DEBUGGING

### Console Logs:
```javascript
// Los console.error() y console.log() existentes funcionan igual
console.error('Error:', error);
console.log('Data loaded:', data);
```

### DevTools Tips:
1. **Elementos**: Inspecciona las tarjetas renderizadas
2. **Estilos**: Busca en `admin-dashboard.css`
3. **Red**: Verifica que las APIs responden correctamente
4. **Performance**: Las animaciones usadas son GPU-aceleradas

---

## 📊 ESTADÍSTICAS

| Métrica | Valor |
|---------|-------|
| Líneas HTML | ~116 |
| Líneas CSS | ~882 |
| Líneas JS | ~390 |
| Número de clases CSS | ~45 |
| Animaciones | 5 |
| Media queries | 2 |
| Variables CSS | ~20 |

---

## 🚀 PRODUCCIÓN

Para implementar en producción:

1. Copiar archivos actualizados
2. Ejecutar tests existentes
3. Verificar en navegador de producción
4. Verificar rendimiento (Lighthouse)
5. Hacer backup de archivos anteriores

---

## 📞 SOPORTE

Si encuentras problemas:

1. Verifica que el CSS esté siendo servido correctamente
2. Abre DevTools y busca errores en Console
3. Verifica que las APIs respondan correctamente
4. Comprueba que el navegador soporta:
   - `input type="date"` ✓
   - CSS Grid ✓
   - CSS Variables ✓
   - Fetch API ✓

---

✨ **Implementación técnica completada** ✨
