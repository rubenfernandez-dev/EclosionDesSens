/* ========================================
   ÉCLOSION DES SENS - SCRIPT.JS
   JavaScript para interactividad del sitio
   ======================================== */

// ========================================
// MENÚ MÓVIL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      
      // Animación del botón hamburguesa
      menuToggle.classList.toggle('active');
    });

    // Cerrar menú al hacer clic en un enlace
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  }
});

// ========================================
// CARRUSEL
// ========================================
class Carousel {
  constructor() {
    this.slides = document.querySelectorAll('.carousel-slide');
    this.prevBtn = document.getElementById('prevSlide');
    this.nextBtn = document.getElementById('nextSlide');
    this.indicatorsContainer = document.getElementById('carouselIndicators');
    this.currentSlide = 0;
    this.autoPlayInterval = null;

    if (this.slides.length > 0) {
      this.init();
    }
  }

  init() {
    // Crear indicadores
    this.createIndicators();

    // Event listeners para controles
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSlide());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSlide());
    }

    // Auto-play
    this.startAutoPlay();

    // Pausar auto-play al pasar el mouse
    const carouselContainer = document.querySelector('.carousel');
    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', () => this.stopAutoPlay());
      carouselContainer.addEventListener('mouseleave', () => this.startAutoPlay());
    }
  }

  createIndicators() {
    if (!this.indicatorsContainer) return;

    this.slides.forEach((_, index) => {
      const indicator = document.createElement('div');
      indicator.classList.add('carousel-indicator');
      if (index === 0) indicator.classList.add('active');
      indicator.addEventListener('click', () => this.goToSlide(index));
      this.indicatorsContainer.appendChild(indicator);
    });
  }

  goToSlide(n) {
    // Remover clase active de todas las slides
    this.slides.forEach(slide => slide.classList.remove('active'));
    
    // Actualizar indicadores
    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach(indicator => indicator.classList.remove('active'));

    // Establecer nueva slide activa
    this.currentSlide = n;
    if (this.currentSlide >= this.slides.length) this.currentSlide = 0;
    if (this.currentSlide < 0) this.currentSlide = this.slides.length - 1;

    this.slides[this.currentSlide].classList.add('active');
    if (indicators[this.currentSlide]) {
      indicators[this.currentSlide].classList.add('active');
    }
  }

  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Cambiar cada 5 segundos
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }
}

// Inicializar carrusel
const carousel = new Carousel();

// ========================================
// ANIMACIONES AL HACER SCROLL
// ========================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observar elementos con clase fade-in
document.addEventListener('DOMContentLoaded', () => {
  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach(el => {
    observer.observe(el);
  });
});

// ========================================
// FORMULARIO DE RESERVAS
// ========================================
const reservaForm = document.getElementById('reservaForm');
let disponibilidadSlots = [];

async function cargarDisponibilidad() {
  try {
    const res = await fetch('/api/reservas/disponibilidad');
    const data = await res.json();
    if (data.success) {
      disponibilidadSlots = data.disponibilidad || [];
      actualizarHorasSegunDia();
    }
  } catch (err) {
    console.error('No se pudo cargar disponibilidad', err);
  }
}

function horasPorDia(diaSemana) {
  return disponibilidadSlots
    .filter(slot => Number(slot.dia_semana) === Number(diaSemana) && Number(slot.disponible) === 1)
    .map(slot => (slot.hora || '').slice(0, 5))
    .filter(Boolean)
    .sort();
}

function actualizarHorasSegunDia() {
  const fechaInput = document.getElementById('fecha_reserva');
  const horaSelect = document.getElementById('hora_reserva');
  if (!fechaInput || !horaSelect) return;

  const fechaValor = fechaInput.value;
  if (!fechaValor) {
    horaSelect.innerHTML = '<option value="">Selecciona una hora disponible</option>';
    horaSelect.setCustomValidity('Selecciona una fecha para ver los horarios');
    return;
  }

  const diaSemana = new Date(fechaValor).getDay(); // 0 domingo ... 6 sábado
  const horas = horasPorDia(diaSemana);

  horaSelect.innerHTML = '';
  if (!horas.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No hay horarios para este día';
    horaSelect.appendChild(opt);
    horaSelect.setCustomValidity('No hay horarios disponibles para este día');
    return;
  }

  horaSelect.setCustomValidity('');
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona una hora disponible';
  horaSelect.appendChild(placeholder);

  horas.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    horaSelect.appendChild(opt);
  });
}

if (reservaForm) {
  reservaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('reservaMessage');

    // Deshabilitar botón durante el envío
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Recopilar datos del formulario
    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      email: document.getElementById('email').value.trim(),
      fecha_reserva: document.getElementById('fecha_reserva').value,
      hora_reserva: document.getElementById('hora_reserva').value,
      tipo_masaje: document.getElementById('tipo_masaje').value,
      mensaje: document.getElementById('mensaje').value.trim(),
      idioma: languageManager ? languageManager.currentLanguage : 'fr'
    };

    // Validación del lado del cliente
    if (!validarEmail(formData.email)) {
      mostrarMensaje(messageDiv, 'Por favor, ingresa un email válido', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Reserva';
      return;
    }

    if (!validarFechaFutura(formData.fecha_reserva)) {
      mostrarMensaje(messageDiv, 'La fecha de reserva debe ser futura', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Reserva';
      return;
    }

    const diaSemana = new Date(formData.fecha_reserva).getDay();
    const horasDisponibles = horasPorDia(diaSemana);
    if (horasDisponibles.length && !horasDisponibles.includes(formData.hora_reserva)) {
      mostrarMensaje(messageDiv, 'Selecciona una hora disponible para ese día', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Reserva';
      return;
    }

    try {
      // Enviar datos al backend
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        mostrarMensaje(messageDiv, data.message || '¡Reserva enviada con éxito! Te contactaremos pronto.', 'success');
        reservaForm.reset();
        
        // Scroll al mensaje
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        mostrarMensaje(messageDiv, data.message || 'Hubo un error al enviar la reserva', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(messageDiv, 'Error de conexión. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Reserva';
    }
  });
}

// ========================================
// FORMULARIO DE CONTACTO
// ========================================
const contactoForm = document.getElementById('contactoForm');
if (contactoForm) {
  contactoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('contactoSubmitBtn');
    const messageDiv = document.getElementById('contactoMessage');

    // Deshabilitar botón durante el envío
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Recopilar datos del formulario
    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      email: document.getElementById('email').value.trim(),
      mensaje: document.getElementById('mensaje').value.trim()
    };

    // Validación del lado del cliente
    if (!validarEmail(formData.email)) {
      mostrarMensaje(messageDiv, 'Por favor, ingresa un email válido', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Mensaje';
      return;
    }

    if (formData.mensaje.length < 10) {
      mostrarMensaje(messageDiv, 'El mensaje debe tener al menos 10 caracteres', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Mensaje';
      return;
    }

    try {
      // Enviar datos al backend
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        mostrarMensaje(messageDiv, data.message || '¡Mensaje enviado con éxito! Te responderemos pronto.', 'success');
        contactoForm.reset();
        
        // Scroll al mensaje
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        mostrarMensaje(messageDiv, data.message || 'Hubo un error al enviar el mensaje', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(messageDiv, 'Error de conexión. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Mensaje';
    }
  });
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Validar formato de email
 */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validar que la fecha sea futura
 */
function validarFechaFutura(fecha) {
  const fechaSeleccionada = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fechaSeleccionada >= hoy;
}

/**
 * Mostrar mensaje de éxito o error
 */
function mostrarMensaje(elemento, mensaje, tipo) {
  if (!elemento) return;

  elemento.textContent = mensaje;
  elemento.className = `form-message ${tipo}`;
  elemento.style.display = 'block';

  // Auto-ocultar después de 8 segundos
  setTimeout(() => {
    elemento.style.display = 'none';
  }, 8000);
}

// ========================================
// VALIDACIÓN EN TIEMPO REAL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Validación de email en tiempo real
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value && !validarEmail(this.value)) {
        this.style.borderColor = '#c97d7d';
      } else {
        this.style.borderColor = '';
      }
    });
  });

  // Validación de fecha en tiempo real
  const fechaInput = document.getElementById('fecha_reserva');
  if (fechaInput) {
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.setAttribute('min', hoy);

    fechaInput.addEventListener('change', function() {
      if (!validarFechaFutura(this.value)) {
        this.style.borderColor = '#c97d7d';
        alert('Por favor, selecciona una fecha futura');
      } else {
        this.style.borderColor = '';
        actualizarHorasSegunDia();
      }
    });
  }

  cargarDisponibilidad();
});

// ========================================
// SCROLL SUAVE PARA ANCLAS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#' && href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

// ========================================
// LAZY LOADING DE IMÁGENES
// ========================================
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });

  // Observar todas las imágenes con data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ========================================
// PREVENIR ENVÍO MÚLTIPLE DE FORMULARIOS
// ========================================
document.querySelectorAll('form').forEach(form => {
  let isSubmitting = false;
  
  form.addEventListener('submit', function(e) {
    if (isSubmitting) {
      e.preventDefault();
      return false;
    }
    isSubmitting = true;
    
    // Resetear después de 3 segundos por si hay error
    setTimeout(() => {
      isSubmitting = false;
    }, 3000);
  });
});

// ========================================
// FOOTER YEAR
// ========================================
const footerYearEl = document.getElementById('footerYear');
if (footerYearEl) {
  footerYearEl.textContent = `© ${new Date().getFullYear()}`;
}

// ========================================
// FAQ ACCORDION
// ========================================
function toggleFaq(button) {
  const answer = button.nextElementSibling;
  const isActive = button.classList.contains('active');
  
  // Cerrar todos los otros FAQs
  document.querySelectorAll('.faq-question').forEach(q => {
    if (q !== button) {
      q.classList.remove('active');
      q.nextElementSibling.classList.remove('active');
    }
  });
  
  // Toggle el actual
  button.classList.toggle('active');
  answer.classList.toggle('active');
}

// ========================================
