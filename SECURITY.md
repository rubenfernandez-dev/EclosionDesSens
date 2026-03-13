# Security Policy

## Supported Versions

Security updates are provided for the latest version on the default branch.

## Reporting a Vulnerability

If you discover a security vulnerability, please do not open a public issue.

Report privately using one of the following channels:

- Email: info@eclosiondessens.ch
- Subject: [Security] Brief vulnerability title

Please include:

- Vulnerability type and impact
- Affected endpoint, file, or flow
- Steps to reproduce
- Proof of concept (if available)
- Suggested remediation (optional)

## Response Process

- Initial acknowledgment target: within 72 hours
- Triage and risk assessment: as soon as possible
- Fix development and validation: based on severity
- Disclosure: coordinated after fix release

## Security Best Practices for Contributors

- Never commit secrets, credentials, or .env files
- Use strong SESSION_SECRET values in all environments
- Validate and sanitize all user input
- Apply least privilege for database users
- Keep dependencies up to date
