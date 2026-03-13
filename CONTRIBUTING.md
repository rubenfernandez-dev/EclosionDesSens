# Contributing Guide

Thank you for your interest in contributing to Eclosion des sens.

## Before You Start

- Open an issue first for significant changes.
- Keep pull requests focused and small.
- Follow existing project structure and naming conventions.
- Use English for code comments, commits, pull request descriptions, and documentation updates.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
cp .env.example .env
```

4. Configure MySQL and initialize the database:

```bash
npm run setup
```

5. Start the app in development mode:

```bash
npm run dev
```

## Branch Naming

Use descriptive names, for example:

- feature/admin-password-policy
- fix/booking-time-conflict
- docs/readme-refresh

## Commit Message Style

Use clear, imperative messages:

- feat: add availability conflict check
- fix: prevent duplicate booking slot
- docs: update environment variable section

## Pull Request Checklist

- Code builds and runs locally.
- No sensitive values were committed.
- Relevant docs were updated.
- Changes are scoped to the issue.
- Manual tests were performed for affected flows.

## Testing Guidance

This project currently relies on manual validation. When changing API logic, test at least:

- Booking creation success and conflict scenarios
- Contact form validation and insert flow
- Admin login/logout/session endpoints
- Admin booking and availability management endpoints

## Reporting Bugs

Please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, MySQL version)
- Logs or screenshots when applicable

## Code of Conduct

By participating, you agree to follow CODE_OF_CONDUCT.md.
