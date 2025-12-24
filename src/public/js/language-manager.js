// Sistema de gestión de idiomas
class LanguageManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = this.getStoredLanguage() || 'es';
    this.supportedLanguages = ['es', 'fr', 'de'];
    this.init();
  }

  getStoredLanguage() {
    return localStorage.getItem('selectedLanguage');
  }

  setStoredLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
  }

  async init() {
    try {
      const response = await fetch('/js/translations.json');
      this.translations = await response.json();
      this.applyLanguage(this.currentLanguage);
      this.setupLanguageSelector();
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  setupLanguageSelector() {
    // Crear selector si no existe
    const existing = document.getElementById('languageSelector');
    if (existing) return;

    const langSelector = document.createElement('div');
    langSelector.id = 'languageSelector';
    langSelector.className = 'language-selector';

    const flagMap = {
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪'
    };

    let html = '<div class="language-buttons">';
    this.supportedLanguages.forEach(lang => {
      const isActive = lang === this.currentLanguage ? 'active' : '';
      html += `<button class="lang-btn ${isActive}" data-lang="${lang}" title="Switch to ${lang.toUpperCase()}">${flagMap[lang]}</button>`;
    });
    html += '</div>';

    langSelector.innerHTML = html;

    // Insertar en nav-container (dentro del header)
    const navContainer = document.querySelector('.nav-container');
    if (navContainer) {
      navContainer.appendChild(langSelector);
    } else {
      // Fallback si no existe nav-container
      const header = document.querySelector('header') || document.querySelector('nav');
      if (header) {
        header.appendChild(langSelector);
      }
    }

    // Agregar event listeners
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        this.changeLanguage(lang);
      });
    });
  }

  changeLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) return;

    this.currentLanguage = lang;
    this.setStoredLanguage(lang);
    this.applyLanguage(lang);

    // Actualizar botones activos
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Si es página admin, recargar sin cambiar URL (ya que es single page app)
    if (document.querySelector('.admin-header')) {
      this.updateAdminPanel();
    }
  }

  applyLanguage(lang) {
    document.documentElement.lang = lang;

    // Traducir elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const translation = this.get(key);
      if (translation) {
        if (element.tagName === 'INPUT' && element.type === 'placeholder') {
          element.placeholder = translation;
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // Traducir placeholders con data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      const translation = this.get(key);
      if (translation) {
        element.placeholder = translation;
      }
    });

    // Traducir atributos
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const attrKey = element.dataset.i18nAttr;
      const translation = this.get(attrKey);
      if (translation) {
        const attr = element.dataset.i18nAttrName || 'title';
        element.setAttribute(attr, translation);
      }
    });
  }

  get(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  updateAdminPanel() {
    // Actualizar textos específicos del panel admin
    const t = this.get.bind(this);

    // Actualizar headers
    const clientHeader = document.querySelector('th:nth-child(1)');
    if (clientHeader) clientHeader.innerHTML = `👤 ${t('admin.cliente')} <span class="sort-icon">⇅</span>`;

    // Actualizar placeholders
    const textareas = document.querySelectorAll('.reserva-textarea');
    textareas.forEach(ta => {
      ta.placeholder = t('admin.notas_internas');
    });

    // Recargar mensajes
    this.updateMessages();
  }

  updateMessages() {
    // Actualizar mensaje de sin reservas
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
      emptyState.textContent = this.get('admin.sin_reservas');
    }
  }
}

// Inicializar al cargar el documento
let languageManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
  });
} else {
  languageManager = new LanguageManager();
}
