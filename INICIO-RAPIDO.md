# 🚀 Inicio Rápido - Éclosion des sens

## Instalación y Configuración (5 minutos)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus datos reales
# - Credenciales de MySQL
# - Configuración SMTP para emails
```

### 3. Configurar MySQL
```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar el script (copiar desde README.md sección "Configuración de la Base de Datos")
```

### 4. Iniciar el servidor
```bash
npm start
```

### 5. Abrir en el navegador
```
http://localhost:4000
```

---

## Comandos Disponibles

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

---

## ¿Problemas?

### Error de conexión a MySQL
- Verifica que MySQL esté ejecutándose: `sudo systemctl status mysql`
- Verifica las credenciales en `.env`

### Error de correos
- Verifica las credenciales SMTP en `.env`
- Para Gmail, usa una "Contraseña de aplicación"

### Puerto 4000 en uso
- Cambia el puerto en `.env`: `PORT=5000`

---

## Estructura Básica

```
/src/public/     → Frontend (HTML, CSS, JS)
/src/routes/     → Rutas API (reservas, contacto)
/src/config/     → Configuración (DB, emails)
/src/server.js   → Servidor principal
```

---

## Próximos Pasos

1. ✅ Agregar tus propias imágenes en `/src/public/img/`
2. ✅ Personalizar textos en los archivos HTML
3. ✅ Configurar SMTP real para emails
4. ✅ Desplegar en VPS (ver README.md completo)

---

📖 **Documentación completa**: Ver [README.md](README.md)
