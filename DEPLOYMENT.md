# Éclosion des Sens — Deployment

Notas de despliegue para `eclosiondessens.ch`.

## Arquitectura

- Node.js + Express
- PM2
- MySQL
- nginx como reverse proxy
- HTTPS mediante Let's Encrypt / Certbot
- Sesiones persistentes mediante `express-session` + `express-mysql-session`

La aplicación escucha actualmente en:

`127.0.0.1:4000`

## nginx

Archivo actual:

`/etc/nginx/conf.d/eclosiondessens.com.conf`

Dentro del bloque `location /` deben mantenerse estas líneas:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

## Sesiones Admin

Las sesiones del Admin se guardan en MySQL mediante:

`express-session` + `express-mysql-session`

Tabla utilizada:

`sessions`

La sesión dura aproximadamente 4 horas.

Importante: no volver a usar `MemoryStore` en producción.


## Seguridad Admin

Medidas actualmente implementadas:

- Cookies `HttpOnly`
- Cookies `Secure` en producción
- `SameSite=Lax`
- Sesiones persistentes en MySQL
- Regeneración del ID de sesión después del login
- Guardado explícito de sesión después del login
- Protección server-side de `/admin`
- Protección de `/admin/dashboard`
- `Cache-Control: no-store` en páginas Admin
- Rate limiting en el login
- Protección CSRF en operaciones sensibles
- `X-Powered-By` desactivado

### Rate limiting

El login Admin permite actualmente:

`5 intentos fallidos por IP cada 15 minutos`

Los logins correctos no consumen el límite.

### CSRF

Después del login se genera un token CSRF asociado a la sesión.

`GET /api/admin/me` devuelve el token al dashboard autenticado.

Las operaciones:

`POST`, `PUT`, `PATCH` y `DELETE`

dentro del Admin deben enviar la cabecera:

`X-CSRF-Token`

Una petición sin token válido devuelve:

`403`

---

## Archivos estáticos

Los archivos públicos deben servirse únicamente desde:

`src/public`

No volver a servir la raíz completa del proyecto con algo como:

`express.static(path.join(__dirname, '..'))`

Esto expondría archivos internos del proyecto.

Actualmente deben devolver `404`:

- `/package.json`
- `/src/server.js`
- `/.env`

Comprobación:

```bash
curl -s -o /dev/null -w "package.json -> %{http_code}\n" https://eclosiondessens.ch/package.json
curl -s -o /dev/null -w "server.js -> %{http_code}\n" https://eclosiondessens.ch/src/server.js
curl -s -o /dev/null -w ".env -> %{http_code}\n" https://eclosiondessens.ch/.env




PM2

Nombre del proceso:

eclosion-des-sens

Comprobar estado:

pm2 list

Ver información:

pm2 describe eclosion-des-sens

Reiniciar:

pm2 restart eclosion-des-sens

Ver logs:

pm2 logs eclosion-des-sens --lines 50 --nostream
Comprobaciones después de cambios

Revisar sintaxis:

node --check src/server.js
node --check src/routes/admin.js
node --check src/public/js/admin-dashboard.js

Comprobar Git:

git diff --check
git status --short

Probar en navegador:

Abrir ventana de incógnito.
Entrar directamente en /admin/dashboard.
Debe redirigir al login.
Iniciar sesión.
Recargar el dashboard.
La sesión debe seguir activa.
Probar logout.
Git y secretos

No subir nunca al repositorio:

.env
contraseñas
tokens
claves SSH
dumps de base de datos
backups sensibles
archivos .bak con datos privados

Repositorio:

https://github.com/rubenfernandez-dev/EclosionDesSens.git

Incidencia importante — agosto 2026

El Admin tenía este comportamiento:

POST /api/admin/login devolvía 200
el dashboard cargaba
inmediatamente GET /api/admin/me devolvía 401
el navegador no recibía la cookie de sesión

La causa raíz fue que nginx no enviaba:

proxy_set_header X-Forwarded-Proto $scheme;

Como Express estaba detrás de nginx y la cookie era Secure, la aplicación no detectaba correctamente que la conexión original del cliente era HTTPS.

También se detectó que express-session utilizaba MemoryStore en producción.

Se corrigió sustituyéndolo por sesiones persistentes en MySQL mediante:

express-mysql-session

También se añadieron:

X-Real-IP
X-Forwarded-For

para que el rate limiting pueda identificar correctamente la IP real del cliente.
