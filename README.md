# 🌿 Éclosion des sens - Sitio Web Completo

Proyecto web completo para la clínica de masajes **Éclosion des sens** en Suiza. Incluye frontend (HTML, CSS, JS) y backend (Node.js + Express + MySQL) listo para desplegar en VPS con Nginx y PM2.

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación Local](#instalación-local)
- [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
- [Variables de Entorno](#variables-de-entorno)
- [Ejecución del Proyecto](#ejecución-del-proyecto)
- [Despliegue en VPS](#despliegue-en-vps)
- [Configuración de Nginx](#configuración-de-nginx)
- [Configuración de PM2](#configuración-de-pm2)
- [Funcionalidades](#funcionalidades)
- [Contacto](#contacto)

---

## 📖 Descripción

Sitio web profesional para **Éclosion des sens**, una clínica de masajes ubicada en Suiza. El proyecto incluye:

- **Frontend**: 5 páginas HTML con diseño moderno y responsive
- **Backend**: API REST con Node.js y Express
- **Base de datos**: MySQL para almacenar reservas y mensajes de contacto
- **Correos**: Sistema de notificaciones por email con Nodemailer
- **Despliegue**: Listo para VPS con Nginx como reverse proxy y PM2 como gestor de procesos

**Dominio**: eclosiondessens.ch  
**Email**: info@eclosiondessens.ch  
**Teléfono**: +41 76 575 45 59

---

## 🛠️ Stack Tecnológico

### Frontend
- HTML5
- CSS3 (diseño moderno con paleta tierra/marrón)
- JavaScript Vanilla (sin frameworks)
- Google Fonts (Lora + Nunito)

### Backend
- Node.js
- Express.js
- MySQL (mysql2)
- Nodemailer
- dotenv

### Deployment
- Nginx (reverse proxy)
- PM2 (gestor de procesos)
- VPS Linux

---

## 📁 Estructura del Proyecto

```
Eclosiondessens/
├── src/
│   ├── public/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   └── script.js
│   │   ├── img/
│   │   │   ├── carrusel1.jpg
│   │   │   ├── carrusel2.jpg
│   │   │   ├── carrusel3.jpg
│   │   │   ├── masajista.jpg
│   │   │   ├── profesional.jpg
│   │   │   └── galeria1-9.jpg
│   │   ├── index.html
│   │   ├── quienes-somos.html
│   │   ├── galeria.html
│   │   ├── reservas.html
│   │   └── contacto.html
│   ├── routes/
│   │   ├── reservas.js
│   │   └── contacto.js
│   ├── config/
│   │   ├── db.js
│   │   └── mailer.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 💻 Instalación Local

### Prerrequisitos

- **Node.js** (v16 o superior)
- **MySQL** (v5.7 o superior)
- **npm** o **yarn**

### Pasos

1. **Clonar o descargar el proyecto**

```bash
cd Eclosiondessens
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos reales (ver sección [Variables de Entorno](#variables-de-entorno)).

4. **Configurar la base de datos**

Ejecuta el script SQL proporcionado en la sección [Configuración de la Base de Datos](#configuración-de-la-base-de-datos).

5. **Iniciar el servidor**

```bash
npm start
```

El servidor estará disponible en: **http://localhost:4000**

---

## 🗄️ Configuración de la Base de Datos

### Crear la base de datos y las tablas

Conéctate a MySQL y ejecuta el siguiente script:

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS clinica_masajes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinica_masajes;

-- Tabla para reservas
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  fecha_reserva DATE NOT NULL,
  hora_reserva TIME NOT NULL,
  tipo_masaje VARCHAR(100) NOT NULL,
  mensaje TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha_reserva (fecha_reserva),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para mensajes de contacto
CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Verificar las tablas

```sql
USE clinica_masajes;
SHOW TABLES;
DESCRIBE reservas;
DESCRIBE contactos;
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Puerto del servidor
PORT=4000

# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=clinica_masajes

# Configuración del servidor SMTP para envío de correos
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=tu_usuario_smtp
SMTP_PASSWORD=tu_contraseña_smtp

# Emails
EMAIL_FROM="Éclosion des sens <no-reply@eclosiondessens.ch>"
EMAIL_EMPRESA="info@eclosiondessens.ch"
```

### Ejemplo con Gmail (SMTP)

Si usas Gmail para enviar correos:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicación
```

> **Nota**: Para Gmail, necesitas generar una "Contraseña de aplicación" desde la configuración de seguridad de tu cuenta.

---

## 🚀 Ejecución del Proyecto

### Modo desarrollo (con nodemon)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

### Verificar que el servidor está funcionando

Abre tu navegador y visita:
- **http://localhost:4000**

Deberías ver la página de inicio de Éclosion des sens.

---

## 🌐 Despliegue en VPS

### 1. Preparar el VPS

Conéctate a tu VPS vía SSH:

```bash
ssh usuario@tu-vps-ip
```

### 2. Instalar Node.js

```bash
# Instalar Node.js v18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 3. Instalar MySQL

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 4. Instalar PM2 globalmente

```bash
sudo npm install -g pm2
```

### 5. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 6. Subir el proyecto al VPS

Opción 1: Usando Git

```bash
cd /var/www
sudo git clone tu-repositorio.git eclosiondessens
cd eclosiondessens
```

Opción 2: Usando SCP/SFTP

```bash
# Desde tu máquina local
scp -r ./Eclosiondessens usuario@tu-vps-ip:/var/www/
```

### 7. Configurar el proyecto en el VPS

```bash
cd /var/www/eclosiondessens
npm install --production
```

Crea el archivo `.env` con los datos reales:

```bash
nano .env
```

Pega el contenido de las variables de entorno y guarda.

### 8. Configurar la base de datos

```bash
sudo mysql -u root -p
```

Ejecuta el script SQL de creación de tablas (ver sección anterior).

### 9. Cambiar permisos

```bash
sudo chown -R $USER:$USER /var/www/eclosiondessens
chmod -R 755 /var/www/eclosiondessens
```

---

## ⚙️ Configuración de Nginx

### 1. Crear archivo de configuración

```bash
sudo nano /etc/nginx/sites-available/eclosiondessens
```

### 2. Agregar la siguiente configuración

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name eclosiondessens.ch www.eclosiondessens.ch;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cachear archivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:4000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Habilitar el sitio

```bash
sudo ln -s /etc/nginx/sites-available/eclosiondessens /etc/nginx/sites-enabled/
```

### 4. Verificar configuración

```bash
sudo nginx -t
```

### 5. Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

### 6. Habilitar HTTPS con Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d eclosiondessens.ch -d www.eclosiondessens.ch
```

Certbot configurará automáticamente SSL y redireccionará HTTP a HTTPS.

---

## 🔄 Configuración de PM2

### 1. Iniciar la aplicación con PM2

```bash
cd /var/www/eclosiondessens
pm2 start src/server.js --name eclosion-des-sens
```

### 2. Configurar PM2 para iniciar en el arranque del sistema

```bash
pm2 startup
pm2 save
```

### 3. Comandos útiles de PM2

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs eclosion-des-sens

# Reiniciar aplicación
pm2 restart eclosion-des-sens

# Detener aplicación
pm2 stop eclosion-des-sens

# Eliminar aplicación de PM2
pm2 delete eclosion-des-sens

# Ver información detallada
pm2 info eclosion-des-sens

# Monitoreo en tiempo real
pm2 monit
```

### 4. Archivo de configuración PM2 (opcional)

Crear archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'eclosion-des-sens',
    script: './src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

Iniciar con:

```bash
pm2 start ecosystem.config.js
```

---

## ✨ Funcionalidades

### Frontend (Páginas HTML)

1. **index.html** - Página de inicio
   - Carrusel automático con 3 imágenes
   - Sección de servicios (4 tipos de masaje)
   - Subsección sobre aceites de calidad
   - Sección "Por qué elegirme" (6 razones)
   - Sección de atención profesional
   - Footer completo

2. **quienes-somos.html** - Información de la clínica
   - Diseño de dos columnas (texto + imagen)
   - Filosofía y valores
   - Experiencia profesional

3. **galeria.html** - Galería de imágenes
   - Grid responsive con 9+ imágenes
   - Efecto hover suave

4. **reservas.html** - Formulario de reservas
   - Campos: nombre, teléfono, email, fecha, hora, tipo de masaje, mensaje
   - Validación frontend y backend
   - Envío de emails automáticos

5. **contacto.html** - Formulario de contacto
   - Campos: nombre, email, mensaje
   - Mapa de Google Maps
   - Información de contacto

### Backend (API REST)

- **POST /api/reservas** - Registrar nueva reserva
  - Guarda en base de datos
  - Envía email al cliente (confirmación)
  - Envía email a la empresa (notificación)

- **POST /api/contacto** - Registrar mensaje de contacto
  - Guarda en base de datos
  - Envía email a la empresa

### Características Técnicas

- ✅ Diseño responsive (mobile, tablet, desktop)
- ✅ Carrusel automático con controles manuales
- ✅ Animaciones suaves al hacer scroll
- ✅ Validación de formularios (frontend y backend)
- ✅ Sistema de emails HTML profesionales
- ✅ Menú hamburguesa en móviles
- ✅ Paleta de colores tierra/marrón elegante
- ✅ Tipografía moderna (Google Fonts)
- ✅ Footer completo con enlaces y contacto
- ✅ SEO-friendly (meta tags, alt en imágenes)

---

## 📧 Sistema de Correos

El sistema envía correos automáticos en los siguientes casos:

### Reservas
- **Cliente**: Confirmación de reserva con detalles
- **Empresa**: Notificación con datos del cliente

### Contacto
- **Empresa**: Notificación con mensaje del cliente

Todos los correos están en formato HTML profesional con el branding de Éclosion des sens.

---

## 🎨 Paleta de Colores

- **Primario**: `#8b7355` (marrón cálido)
- **Secundario**: `#b89968` (dorado tierra)
- **Acento**: `#9fb8ad` (verde agua suave)
- **Beige**: `#e8dfd5`
- **Crema**: `#f9f6f2`
- **Texto**: `#5a4a3a`

---

## 📝 Notas Importantes

### Seguridad

- ❌ **NUNCA** subas el archivo `.env` al repositorio
- ✅ Usa `.gitignore` para excluir archivos sensibles
- ✅ Configura firewall en el VPS (solo puertos 22, 80, 443)
- ✅ Mantén Node.js, MySQL y dependencias actualizadas

### Imágenes

Este proyecto usa imágenes placeholder. Debes:
1. Agregar tus propias imágenes en `/src/public/img/`
2. Mantener los nombres de archivo especificados o actualizar las referencias en el HTML

Imágenes requeridas:
- `carrusel1.jpg`, `carrusel2.jpg`, `carrusel3.jpg`
- `masajista.jpg`
- `profesional.jpg`
- `galeria1.jpg` hasta `galeria9.jpg`

### Mantenimiento

- Revisa logs de PM2 regularmente
- Haz backups de la base de datos
- Monitorea el uso de recursos del servidor

---

## 📞 Contacto

**Éclosion des sens**  
📧 Email: info@eclosiondessens.ch  
📱 Teléfono: +41 76 575 45 59  
🌐 Web: eclosiondessens.ch

---

## 📄 Licencia

Este proyecto es privado y exclusivo para **Éclosion des sens**.

---

## 🙏 Soporte

Si tienes problemas con el despliegue o configuración:

1. Verifica los logs: `pm2 logs eclosion-des-sens`
2. Verifica Nginx: `sudo nginx -t`
3. Revisa las variables de entorno en `.env`
4. Verifica la conexión a MySQL: `sudo systemctl status mysql`

---

**¡Gracias por usar este proyecto! 🌿**
