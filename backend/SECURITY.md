# Security Policy

## Reporting a Vulnerability

If you discover a security issue in FLASH, please report it privately:

**Email:** security@flash.app (placeholder — will be updated before launch)

Please include:
- A description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Do not open a public GitHub issue for security vulnerabilities.**

We aim to acknowledge reports within 72 hours and to provide a fix timeline within 7 days.

## Scope

In scope:
- The FLASH backend API (`backend/`)
- The FLASH frontend dashboard and games (`frontend/`)
- Authentication and authorization logic
- Data handling of user sessions and cognitive profiles
- AI integration paths (Groq, OpenRouter, Gemini)

Out of scope:
- Denial-of-service via resource exhaustion on free-tier services
- Issues in third-party services (report to the provider)
- Social engineering

## Supported Versions

Only the latest commit on `main` is supported.

| Version | Supported |
|---------|-----------|
| main    | Yes       |

## Security Best Practices for Contributors

- Never commit `.env` or any file containing secrets.
- Use `.env.example` as the template.
- Rotate any leaked key immediately.
- Follow the evidence-ladder rules (no clinical claims in code or prompts).
- Keep dependencies up to date (Dependabot enabled).

## Disclosure

We follow coordinated disclosure. We will credit reporters (with permission) after a fix is released.

Thank you for helping keep FLASH and its users safe.
