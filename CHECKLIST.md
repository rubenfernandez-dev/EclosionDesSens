# ✅ Checklist de Configuración - Éclosion des sens

## 📋 Lista de Tareas para Poner en Marcha el Proyecto

### 🔧 Configuración Inicial

- [ ] **Instalar Node.js** (v16 o superior)
  - Descargar de: https://nodejs.org/
  - Verificar: `node --version`

- [ ] **Instalar MySQL** (v5.7 o superior)
  - Verificar: `mysql --version`

- [ ] **Clonar/Descargar el proyecto**
  - Ubicación actual: `C:\Users\Ruben\Desktop\Eclosiondessens`

---

### 📦 Instalación de Dependencias

- [ ] **Abrir terminal en la carpeta del proyecto**
  ```bash
  cd C:\Users\Ruben\Desktop\Eclosiondessens
  ```

- [ ] **Instalar dependencias de Node.js**
  ```bash
  npm install
  ```

---

### 🗄️ Configuración de Base de Datos

- [ ] **Iniciar MySQL**
  ```bash
  # Windows
  net start MySQL
  
  # Linux/Mac
  sudo systemctl start mysql
  ```

- [ ] **Crear base de datos y tablas**
  ```bash
  mysql -u root -p < database.sql
  ```
  
  O manualmente:
  ```bash
  mysql -u root -p
  ```
  Y luego copiar/pegar el contenido de `database.sql`

- [ ] **Verificar que las tablas se crearon**
  ```sql
  USE clinica_masajes;
  SHOW TABLES;
  ```

---

### 🔐 Configuración de Variables de Entorno

- [ ] **Crear archivo .env**
  ```bash
  # Windows
  copy .env.example .env
  
  # Linux/Mac
  cp .env.example .env
  ```

- [ ] **Editar .env con datos reales**
  
  Completar:
  - [ ] `DB_HOST` (generalmente `localhost`)
  - [ ] `DB_USER` (tu usuario de MySQL)
  - [ ] `DB_PASSWORD` (tu contraseña de MySQL)
  - [ ] `DB_NAME` (dejar `clinica_masajes`)
  - [ ] `SMTP_HOST` (ej: `smtp.gmail.com`)
  - [ ] `SMTP_PORT` (ej: `587`)
  - [ ] `SMTP_USER` (tu email)
  - [ ] `SMTP_PASSWORD` (contraseña o app password)
  - [ ] `EMAIL_FROM` (email remitente)
  - [ ] `EMAIL_EMPRESA` (dejar `info@eclosiondessens.ch`)

---

### 📧 Configuración de Emails (SMTP)

#### Opción 1: Gmail

- [ ] **Habilitar "Acceso de aplicaciones menos seguras"** O
- [ ] **Crear contraseña de aplicación**
  1. Ir a: https://myaccount.google.com/security
  2. Buscar "Contraseñas de aplicaciones"
  3. Generar nueva contraseña
  4. Usar esa contraseña en `SMTP_PASSWORD`

Configuración Gmail en .env:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicacion
```

#### Opción 2: Otro proveedor SMTP

- [ ] Consultar documentación de tu proveedor
- [ ] Configurar datos SMTP correspondientes

---

### 🖼️ Agregar Imágenes

- [ ] **Ir a la carpeta** `src/public/img/`

- [ ] **Agregar las siguientes imágenes:**
  - [ ] `carrusel1.jpg` (1920x1080px)
  - [ ] `carrusel2.jpg` (1920x1080px)
  - [ ] `carrusel3.jpg` (1920x1080px)
  - [ ] `masajista.jpg` (800x1000px)
  - [ ] `profesional.jpg` (800x600px)
  - [ ] `galeria1.jpg` hasta `galeria9.jpg` (800x600px)

**Nota:** Ver `src/public/img/README.md` para más detalles

---

### 🚀 Prueba Local

- [ ] **Iniciar el servidor**
  ```bash
  npm start
  ```

- [ ] **Abrir navegador**
  - URL: http://localhost:4000

- [ ] **Verificar páginas:**
  - [ ] Inicio (`/`)
  - [ ] Quiénes somos (`/quienes-somos.html`)
  - [ ] Galería (`/galeria.html`)
  - [ ] Reservas (`/reservas.html`)
  - [ ] Contacto (`/contacto.html`)

- [ ] **Probar funcionalidades:**
  - [ ] Carrusel funciona automáticamente
  - [ ] Menú responsive en móvil
  - [ ] Formulario de reservas envía correctamente
  - [ ] Formulario de contacto envía correctamente
  - [ ] Se reciben emails de confirmación

---

### 🎨 Personalización de Contenido

- [ ] **Revisar y editar textos en:**
  - [ ] `src/public/index.html`
  - [ ] `src/public/quienes-somos.html`
  - [ ] `src/public/galeria.html`
  - [ ] `src/public/reservas.html`
  - [ ] `src/public/contacto.html`

- [ ] **Ajustar servicios:**
  - [ ] Tipos de masaje
  - [ ] Duraciones
  - [ ] Descripciones

- [ ] **Verificar datos de contacto:**
  - [ ] Teléfono: `+41 76 575 45 59`
  - [ ] Email: `info@eclosiondessens.ch`
  - [ ] Dominio: `eclosiondessens.ch`

---

### 🌐 Preparación para Despliegue

- [ ] **Verificar que todo funciona localmente**

- [ ] **Contratar VPS** (si aún no tienes)
  - Recomendado: DigitalOcean, Linode, AWS, etc.
  - Especificaciones mínimas: 1GB RAM, 25GB SSD

- [ ] **Registrar/Configurar dominio**
  - Dominio: `eclosiondessens.ch`
  - Configurar DNS apuntando a IP del VPS

---

### 🖥️ Despliegue en VPS (Producción)

Ver **README.md** sección "Despliegue en VPS" para instrucciones completas.

**Resumen:**
- [ ] Conectar al VPS via SSH
- [ ] Instalar Node.js, MySQL, Nginx, PM2
- [ ] Subir proyecto al VPS
- [ ] Configurar base de datos
- [ ] Configurar variables de entorno
- [ ] Configurar Nginx (ver `nginx.conf.example`)
- [ ] Iniciar con PM2 (ver `ecosystem.config.js`)
- [ ] Configurar SSL con Certbot

---

### 🔒 Seguridad

- [ ] **Cambiar contraseñas predeterminadas**
- [ ] **No subir archivo .env al repositorio**
- [ ] **Configurar firewall en VPS**
- [ ] **Instalar certificado SSL**
- [ ] **Mantener dependencias actualizadas**
  ```bash
  npm update
  ```

---

### 📊 Monitoreo y Mantenimiento

- [ ] **Configurar backups automáticos de BD**
- [ ] **Revisar logs regularmente**
  ```bash
  # PM2 logs
  pm2 logs eclosion-des-sens
  
  # Nginx logs
  sudo tail -f /var/log/nginx/eclosiondessens_access.log
  ```

- [ ] **Verificar espacio en disco**
- [ ] **Monitorear uso de recursos**

---

### 📝 Documentación Leída

- [ ] `README.md` - Documentación completa
- [ ] `INICIO-RAPIDO.md` - Guía rápida
- [ ] `PROYECTO-COMPLETO.md` - Resumen del proyecto
- [ ] `LEEME.txt` - Archivo visual de resumen

---

## ✅ Proyecto Listo

Cuando todas las casillas estén marcadas, tu proyecto estará completamente configurado y funcionando.

---

## 🆘 ¿Necesitas Ayuda?

### Problemas Comunes

**Error: Cannot connect to database**
- Verifica que MySQL esté ejecutándose
- Revisa credenciales en .env
- Verifica que la BD `clinica_masajes` exista

**Error: Failed to send email**
- Verifica configuración SMTP en .env
- Para Gmail, usa contraseña de aplicación
- Verifica que el puerto SMTP esté abierto

**Puerto 4000 en uso**
- Cambia el puerto en .env: `PORT=5000`
- O mata el proceso que usa el puerto 4000

**Imágenes no se muestran**
- Verifica que las imágenes estén en `src/public/img/`
- Verifica los nombres de archivo
- Verifica permisos de lectura

---

## 📞 Soporte

Para más información:
- Lee la documentación en `README.md`
- Revisa los comentarios en el código
- Consulta los archivos de ejemplo

---

**¡Éxito con tu proyecto Éclosion des sens! 🌿**
