# FLASH - Cognitive Training Platform

A free, science-backed alternative to Lumosity/Peak. 42 games, 10 cognitive domains, AI-powered adaptive difficulty.

## Architecture
- **Frontend:** Vanilla HTML/CSS/JS (No build step)
- **Backend:** Fastify 5 + TypeScript + Neon PostgreSQL
- **AI:** Groq (Primary), OpenRouter, Gemini
- **Mobile:** Capacitor (Android)

## Quick Start (Local)
1. Backend: `cd backend && npm install && npm run dev`
2. Frontend: `npx --yes serve . -l 9999`
3. Open: `http://localhost:9999/frontend/dashboard/`

## Structure
Check `PROJECT_STRUCTURE.md` for a complete map of the project files and directories.

## Note on Missing Files
The core design system (`tokens.css`, `base.css`, `layout.css`) and environment variables (`.env`) are excluded from this repository for proprietary and security reasons. You must supply your own design tokens or contact the author to run the UI as intended.

## Looking for a Co-Founder
We are looking for a Technical Co-Founder / Senior Engineer to help with architecture review, backend scaling, and AI integration.

## License
MIT