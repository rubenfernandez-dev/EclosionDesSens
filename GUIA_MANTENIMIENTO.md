# 🎓 GUÍA DE USO Y MANTENIMIENTO

## 📚 Archivos Modificados

### HTMLs Actualizados (9 archivos)
1. ✅ `src/public/index.html`
2. ✅ `src/public/quienes-somos.html`
3. ✅ `src/public/services.html`
4. ✅ `src/public/galeria.html`
5. ✅ `src/public/reservas.html`
6. ✅ `src/public/contacto.html`
7. ✅ `src/public/politique-confidentialite.html`
8. ✅ `src/public/admin/login.html`
9. ✅ `src/public/admin/dashboard.html`

### CSSs Actualizados (2 archivos)
1. ✅ `src/public/css/styles.css`
2. ✅ `src/public/css/admin-dashboard.css`

---

## 🔧 CÓMO MANTENER Y PERSONALIZAR

### 1. Añadir Más Reseñas

**Ubicación:** `src/public/index.html` (línea ~136)

**Código a copiar:**
```html
<div class="review fade-in">
    <div class="review-photo placeholder">👤</div>
    <div class="review-stars">⭐⭐⭐⭐⭐</div>
    <p class="review-text">Tu reseña aquí...</p>
    <span class="review-author">Nombre del cliente</span>
</div>
```

**Opciones:**
- Si tienes foto del cliente, reemplaza `placeholder` con la URL:
  ```html
  <img src="/ruta/a/foto.jpg" alt="Nombre cliente" class="review-photo">
  ```
- Para valoración de 4 estrellas:
  ```html
  <div class="review-stars">⭐⭐⭐⭐☆</div>
  ```

**Límite:** Se recomienda máximo 12 reseñas para mantener rendimiento

---

### 2. Cambiar Colores Principales

**Ubicación:** `src/public/css/styles.css` (línea ~19)

**Variables a modificar:**
```css
:root {
  --color-primary: #B05032;        /* Cambiar este color */
  --color-primary-dark: #B05032;   /* Oscuro */
  --color-primary-light: #a89079;  /* Claro */
  --color-secondary: #b89968;      /* Secundario */
  --color-accent: #9fb8ad;         /* Acento */
}
```

**Ejemplo:** Para cambiar a azul
```css
--color-primary: #1e40af;        /* Azul fuerte */
--color-primary-dark: #1e3a8a;   /* Azul oscuro */
--color-primary-light: #60a5fa;  /* Azul claro */
--color-secondary: #3b82f6;      /* Azul mediano */
```

El cambio se aplicará automáticamente a:
- CTAs
- Encabezados
- Botones
- Bordes
- Reseñas

---

### 3. Cambiar Tipografía Global

**Ubicación:** `src/public/css/styles.css` (línea ~26)

**Variables CSS:**
```css
--font-heading: 'Lora', serif;      /* Títulos - SERIF elegante */
--font-body: 'Lato', sans-serif;    /* Cuerpo - SANS-SERIF moderna */
```

**Importar nueva tipografía:**

En TODOS los HTML, cambiar el link de Google Fonts:

```html
<!-- Opción 1: Inter (moderna) -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">

<!-- Opción 2: Montserrat (geométrica) -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">

<!-- Opción 3: Poppins (amigable) -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
```

**Luego actualizar CSS:**
```css
:root {
  --font-heading: 'Playfair Display', serif;    /* Para títulos */
  --font-body: 'Inter', sans-serif;            /* Para cuerpo */
}
```

---

### 4. Modificar Espaciado Global

**Ubicación:** `src/public/css/styles.css` (línea ~32)

**Cambiar los valores de espaciado:**
```css
:root {
  --spacing-xs: 0.5rem;    /* 8px  */
  --spacing-sm: 1rem;      /* 16px */
  --spacing-md: 2rem;      /* 32px */
  --spacing-lg: 3rem;      /* 48px */
  --spacing-xl: 4rem;      /* 64px */
}
```

**Ejemplo:** Para más espaciado (diseño más abierto)
```css
--spacing-xs: 0.75rem;    /* 12px */
--spacing-sm: 1.25rem;    /* 20px */
--spacing-md: 2.5rem;     /* 40px */
--spacing-lg: 3.5rem;     /* 56px */
--spacing-xl: 5rem;       /* 80px */
```

---

### 5. Editar Metaetiquetas

**Por página:**

#### index.html
```html
<title>Éclosion des sens - Masajes Profesionales en Suiza</title>
<meta name="description" content="Tu descripción aquí">
<meta name="keywords" content="palabra1, palabra2, palabra3">
```

#### quienes-somos.html
```html
<meta property="og:type" content="profile">
<!-- Importante para la página de Ariane -->
```

#### services.html
```html
<meta property="og:image" content="https://eclosiondessens.ch/img/NUEVA_IMAGEN.jpg">
```

**Tips SEO:**
- Description: máximo 160 caracteres
- Keywords: 5-10 palabras clave principales
- OG Title: igual o similar al `<title>`
- OG Description: igual al meta description
- OG Image: 1200x630px es ideal

---

### 6. Personalizar CTAs

**Ubicación:** `src/public/index.html`

**Cambiar el texto del botón:**
```html
<!-- Antes -->
<a href="/reservas.html" class="cta-section">Prendre rendez-vous</a>

<!-- Después -->
<a href="/reservas.html" class="cta-section">Reservar Ahora</a>
```

**Cambiar el destino:**
```html
<a href="/contacto.html" class="cta-section">Contacta con nosotros</a>
```

**Cambiar estilo del CTA:**

En `styles.css`, modificar `.cta-section`:
```css
.cta-section {
  /* Aumentar padding para botón más grande */
  padding: 1.2rem 2.5rem;
  
  /* Aumentar tamaño de fuente */
  font-size: 1.2rem;
  
  /* Cambiar forma */
  border-radius: 8px;  /* Menos redondeado */
}
```

---

### 7. Ajustar Animaciones

**Ubicación:** `src/public/css/styles.css`

**Velocidad de fade-in:**
```css
@keyframes fadeIn {
  /* ... */
}

.fade-in {
  animation: fadeIn 0.8s ease forwards;  /* Cambiar 0.8s */
}
```

**Ejemplos:**
- `0.3s` = muy rápido
- `0.8s` = normal (actual)
- `1.5s` = lento

**Desactivar animaciones en móviles:**
```css
@media (max-width: 768px) {
  .fade-in {
    animation: none;
    opacity: 1;
  }
}
```

---

### 8. Cambiar Número de Columnas en Reseñas

**Ubicación:** `src/public/css/styles.css` (línea ~2090)

```css
.reviews-grid {
  display: grid;
  /* Cambiar minmax según desees */
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}
```

**Opciones:**
- `minmax(320px, 1fr)` = 3 en desktop, 1 en mobile ✅ (actual)
- `minmax(400px, 1fr)` = 2 en desktop, 1 en mobile
- `minmax(250px, 1fr)` = 4 en desktop, 2 en tablet, 1 en mobile

---

## 📱 RESPONSIVE BREAKPOINTS

Todos los archivos HTML están optimizados para:

```css
/* Desktop grande */
@media (min-width: 1200px) { /* 4 columnas */ }

/* Tablet */
@media (max-width: 768px) { /* 2 columnas */ }

/* Mobile */
@media (max-width: 480px) { /* 1 columna */ }
```

---

## 🔍 VERIFICAR CAMBIOS

### 1. Verificar Meta Tags
Abrir cualquier página en el navegador → Click derecho → Ver código fuente

Buscar:
- ✅ `<meta name="description"...>`
- ✅ `<meta property="og:title"...>`
- ✅ `<meta property="og:image"...>`

### 2. Verificar Tipografía
En DevTools (F12) → Elements → Ver fuente aplicada

Debe mostrar: **Lato** para texto, **Lora** para títulos

### 3. Verificar Reseñas
Scroll a la sección de reseñas en index.html

Debe ver:
- 6 tarjetas de reseñas (o más si añadiste)
- Fotos placeholders en círculo
- Estrellas amarillas
- Efecto hover (levanta la tarjeta)
- CTA "Prendre rendez-vous" al final

### 4. Verificar CTAs
- 4 CTAs en index.html
- 1 CTA en quienes-somos.html
- Botones con color degradado
- Efecto hover (levanta 2px)
- Click redirige a /reservas.html

---

## 🐛 SOLUCIONAR PROBLEMAS COMUNES

### Problema: CTAs no se ven
**Solución:** Verificar clase `cta-section` en CSS
```css
.cta-section {
  display: inline-block;
  /* Debe estar visible */
}
```

### Problema: Tipografía no cambia
**Solución:** 
1. Limpiar caché del navegador (Ctrl+Shift+Del)
2. Verificar que Google Fonts link esté en `<head>`
3. Verificar que CSS variables se hayan actualizado

### Problema: Reseñas no son responsive
**Solución:** Verificar que `reviews-grid` tenga media queries:
```css
@media (max-width: 768px) {
  .reviews-grid {
    grid-template-columns: 1fr;  /* 1 columna */
  }
}
```

### Problema: Colores no cambian
**Solución:**
1. Limpiar caché (Ctrl+F5)
2. Asegurarse de editar `:root` en CSS
3. Verificar que color es válido hex (#RRGGBB)

---

## 📊 TESTING CHECKLIST

Antes de publicar cambios, verificar:

- [ ] ✅ Todos los meta tags están presentes
- [ ] ✅ Tipografía es Lato en todo texto
- [ ] ✅ Colores son consistentes
- [ ] ✅ CTAs funcionan y redirigen bien
- [ ] ✅ Reseñas se ven en 3 dispositivos (mobile, tablet, desktop)
- [ ] ✅ Animaciones son suaves
- [ ] ✅ No hay errores en consola (F12)
- [ ] ✅ Links internos funcionan
- [ ] ✅ Imágenes cargan correctamente
- [ ] ✅ Footer aparece en todas las páginas

---

## 📞 SOPORTE RÁPIDO

### Preguntas Frecuentes:

**P: ¿Dónde añado más reseñas?**
R: En `src/public/index.html` línea 136, dentro de `.reviews-grid`

**P: ¿Cómo cambio el color principal?**
R: En `src/public/css/styles.css` línea 19, variable `--color-primary`

**P: ¿Por qué las CTAs no se ven?**
R: Verificar que la clase `cta-section` exista en CSS

**P: ¿Cómo edito metaetiquetas?**
R: En el `<head>` de cada HTML, etiquetas `<meta>` individuales

**P: ¿Es responsive en móvil?**
R: Sí, todas las secciones nuevas (reseñas, CTAs) son 100% responsive

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. **Google Search Console**
   - Añadir sitio
   - Enviar sitemap.xml
   - Verificar metaetiquetas

2. **Facebook Share Debugger**
   - https://developers.facebook.com/tools/debug
   - Probar cada página
   - Verificar que OG tags se vean

3. **Google Lighthouse**
   - Abrir DevTools (F12)
   - Pestaña Lighthouse
   - Analizar Performance, SEO, Accessibility

4. **Herramientas SEO**
   - Screaming Frog: crawl del sitio
   - Ubersuggest: research de keywords
   - Ahrefs: backlinks y análisis

---

## 📞 CONTACTO PARA AYUDA

Para preguntas sobre los cambios:
- Email: info@eclosiondessens.ch
- Teléfono: +41 76 575 45 59

---

*Última actualización: 25 de Enero de 2026*
*Versión: 1.0*
*Estado: ✅ Listo para producción*
