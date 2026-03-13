# Eclosion des sens

Professional website and operations backend for Eclosion des sens (wellness and massage practice, Switzerland).

## Project Status

This project is in production, fully deployed, and delivered to the client.

This repository is maintained as:

- Official technical source of truth
- Maintenance and improvement baseline
- Internal handover and operational reference

## Highlights

- Multilingual static frontend (HTML/CSS/Vanilla JS)
- Node.js + Express API
- MySQL persistence for bookings, contact messages, and admin data
- Session-based admin authentication
- Email notifications with Nodemailer
- Deployment-ready infrastructure with Nginx and PM2

## Tech Stack

- Node.js
- Express
- MySQL (mysql2)
- express-session
- bcryptjs
- Nodemailer
- Vanilla JavaScript, HTML, CSS

## Repository Structure

```text
.
|- src/
|  |- config/              # Database, mailer, init scripts
|  |- public/              # Public and admin frontend assets
|  |- routes/              # API routes
|  |- server.js            # Application entry point
|- database.sql            # Primary SQL schema
|- clinica_masajes.sql     # SQL snapshot/export
|- ecosystem.config.js     # PM2 process config
|- nginx.conf.example      # Nginx reverse proxy example
|- .env.example            # Environment variable template
|- README.md
```

## Core Functionalities

- Booking workflow with duplicate timeslot prevention
- Contact form workflow with persistence and notification
- Admin authentication and session lifecycle
- Booking management from admin panel (list, update, delete)
- Availability management from admin panel (CRUD)
- Automatic default admin bootstrap (env-driven)

## Quick Local Run

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Initialize database

```bash
npm run setup
```

### 4. Start server

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Default local URL: http://localhost:4000

## Environment Variables

Defined in .env.example. Most important keys:

- PORT
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASSWORD
- EMAIL_FROM
- EMAIL_EMPRESA
- SESSION_SECRET (required)
- ADMIN_DEFAULT_USER
- ADMIN_DEFAULT_PASSWORD

Note: the server will fail to start if SESSION_SECRET is missing.

## API Summary

Base URL (local): http://localhost:4000

Public:

- POST /api/reservas
- GET /api/reservas/disponibilidad
- GET /api/reservas/disponibilidad/:fecha
- DELETE /api/reservas/:id
- POST /api/contacto

Admin (session-protected unless noted):

- POST /api/admin/login
- POST /api/admin/logout
- GET /api/admin/me
- PATCH /api/admin/me/password
- GET /api/admin/reservas
- PATCH /api/admin/reservas/:id
- DELETE /api/admin/reservas/:id
- GET /api/admin/disponibilidad
- POST /api/admin/disponibilidad
- PATCH /api/admin/disponibilidad/:id
- DELETE /api/admin/disponibilidad/:id

## Production Notes

- Use nginx.conf.example as baseline reverse proxy config
- Use PM2 via ecosystem.config.js for process supervision
- Set NODE_ENV=production to enforce secure cookie behavior

## Additional Documentation

Comprehensive project documentation exists in the repository root, including architecture, maintenance, testing, and handover files.

Recommended operational references:

- ARQUITECTURA_TECNICA.md
- INSTRUCCIONES_TECNICAS.md
- GUIA_MANTENIMIENTO.md
- VERIFICACION_FINAL.md

## Community Files

- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md
- CHANGELOG.md
- .github/ISSUE_TEMPLATE/
- .github/pull_request_template.md

## License

ISC License. See LICENSE.
