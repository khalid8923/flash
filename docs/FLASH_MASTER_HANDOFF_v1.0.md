00_MASTER_HANDOFF.md
Executive Summary
FLASH is a browser-based cognitive training platform with 42 mini-games across 10 domains, built on Vanilla HTML/CSS/JS with a Fastify + PostgreSQL backend. The project has recently undergone a massive migration from a web-only application to a mobile application (Android) using Capacitor.

Current Actual State
Mobile Migration: Phase A through Phase K are completed. The Android APK builds successfully (5.91 MB) and runs on an Android Emulator (Pixel 7 API 34).

Frontend: The web UI has been adapted for mobile using a public/ directory and a new mobile-first CSS override (mobile-app.css). Games run in full-screen iframes.

Backend: Running locally on localhost:3000. Currently decoupled from the mobile app (offline mode active on mobile).

Documentation: Recently flattened into a single docs/ folder after an accidental deletion incident was resolved.

Most Important Decisions
Used Capacitor instead of React Native/Flutter to preserve 42 existing Vanilla JS games (zero rewrite).

Mobile app operates in Offline-First mode to avoid localhost conflicts.

Replaced pure localStorage with @capacitor/preferences to ensure data persistence on Android.

Native Android Back Button implemented to exit games.

Most Important Open Issues
Live Reload is currently unstable due to ADB conflict (more than one device).

No production backend deployed yet (deferred).

iOS build is blocked (requires macOS).

Resume Point
The project is ready for feature development and Live Reload setup. The Android app builds and runs. The immediate next step is establishing a stable Live Reload environment without ADB conflicts, followed by testing all 42 games on the emulator.

01_PROJECT_OVERVIEW.md
Name: FLASH

Purpose: Free, science-backed alternative to Lumosity/Peak/BrainHQ.

Target Users: Adults 25-45, students.

Core Features: 42 cognitive games, AI adaptive difficulty, AI coach, bilingual (EN/AR with RTL).

Constraints:

Vanilla JS only (no React, Vue, Angular).

No build step (runs directly in browser/WebView).

Strict 8-file pattern per game.

No L4 (clinical/medical) claims.

Business Goal: $0/month infrastructure, open source, investor-ready.

02_ARCHITECTURE.md
High-Level Architecture
Frontend (Web): Vanilla HTML/CSS/JS. 42 games isolated in iframes. Communication via postMessage.

Frontend (Mobile): Capacitor wraps the public/ folder. Runs inside Android WebView. Offline-first.

Backend: Fastify 5 + TypeScript + Neon PostgreSQL. 85 endpoints. Handles AI routing, session derivation, and adaptive logic.

AI Layer: Multi-provider router (Groq -> OpenRouter -> Gemini) with circuit breaker and L4 validator.

Data Flow (Mobile)
Mobile App (WebView) -> api.js (detects liveMode: false) -> blocks API calls -> saves locally via capacitor-storage.js -> Syncs to backend when online (future).

Data Flow (Web)
Web App -> api.js -> localhost:3000 -> Fastify -> PostgreSQL -> Response.

03_FILE_INVENTORY.md
Critical Directories
D:\Flash\public\: The mobile web root (copied from frontend/). Contains all 42 games, CSS, and JS.

D:\Flash\android\: Capacitor-generated Android project. Do not edit manually unless required.

D:\Flash\frontend\: The original web source code.

D:\Flash\backend\: Fastify backend.

D:\Flash\docs\: Flattened documentation (all .md and .txt files).

Key Mobile Files
public/index.html: Entry point. Loads 73 JS scripts and mobile CSS.

public/js/config.js: Detects Capacitor, disables live API calls on mobile.

public/js/api.js: Offline fallback logic.

public/js/modules/capacitor-storage.js: Bridges localStorage to native preferences.

public/js/modules/back-button.js: Handles Android hardware back button.

public/css/modules/mobile-app.css: Forces mobile layout, hides desktop elements.

capacitor.config.json: webDir: "public", androidScheme: "https".

04_FEATURES_AND_MODULES.md
Feature	Status	Files	Dependencies
42 Games Engine	Implemented, verified on web.	public/games/*	shared/i18n.js, settings.js
Mobile UI Layout	Implemented	public/css/modules/mobile-app.css	None
Native Storage Bridge	Implemented	public/js/modules/capacitor-storage.js	@capacitor/preferences
Hardware Back Button	Implemented	public/js/modules/back-button.js	@capacitor/app
Splash Screen	Implemented	capacitor.config.json	@capacitor/splash-screen
AI Coach/Features	Implemented in backend, disabled on mobile.	backend/src/routes/ai*	Groq, OpenRouter, Gemini
Offline Mode	Implemented	public/js/config.js	None
05_DATABASE_AND_APIS.md
Database
Type: Neon PostgreSQL 17.

Tables: 51 tables (Identity, Catalog, Facts, Derived, AI, Difficulty, Admin, Auth, etc.).

Migrations: 001 to 023 (Frozen). Never modify existing ones.

Key Tables: users, sessions, session_trials, games, player_game_ability.

APIs
Local Base URL: http://localhost:3000.

Mobile Base URL: N/A (Offline mode active).

Production Base URL (Future): https://flash-backend.onrender.com.

Core Endpoints: /sessions (POST), /profile, /games, /ai/chat, /ai/daily-plan.

Idempotency: Handled via x-idempotency-key header.

06_UI_UX_AND_DESIGN_SYSTEM.md
Design Philosophy: Serious instrument, not a game. No confetti, no emojis in UI.

Typography: system-ui, Iowan Old Style (serif), Noto Naskh Arabic.

Colors: Light (Rose: #FFF1F2 bg, #EC4899 accent), Dark (Neon: #000000 bg, #39FF14 accent).

Mobile Layout:

Single column instead of 3 columns.

Bottom navigation simulation.

Full-screen iframes for games.

Viewport locked (maximum-scale=1.0, user-scalable=no).

Responsive Breakpoints: max-width: 768px triggers mobile view.

07_AI_AND_EXTERNAL_SERVICES.md
Providers:

Groq (Primary): gpt-oss-120b (EN), allam-2-7b (AR).
OpenRouter (Fallback): google/gemini-2.0-flash-exp:free.
Gemini (Fallback 2): gemini-2.0-flash.
Safety: L4 clinical claims (ADHD, IQ, etc.) and hype words are blocked by validator.ts.

Fallbacks: Safe static text is returned if all LLMs fail.

Mobile Constraint: AI features are currently disabled on the mobile app to ensure offline stability.

08_BUGS_AND_RESOLUTIONS.md
Bug 001: Broken Script Order in 3 Games
Symptoms: mental-math, num-chains, speed-calc had s=-1, h=-1 in the audit.

Cause: Missing 7 script tags in their game.html.

Fix: Script injected to match the 8-file pattern.

Bug 002: Virtualization Disabled
Symptoms: Android emulator extremely slow or failed to launch.

Cause: Intel Virtualization disabled in BIOS.

Fix: Enabled Intel Virtualization Technology and VT for Direct I/O in Dell BIOS.

Bug 003: Gradle Java Version Mismatch
Symptoms: Java version 17 or higher is required or Gradle build failed.

Cause: System used Java 8 or Java 25, while Android SDK requires Java 17.

Fix: Set JAVA_HOME to C:\Program Files\Android\Android Studio\jbr.

Bug 004: ADB "more than one device/emulator"
Symptoms: adb install fails or hangs.

Cause: Ghost emulators or running multiple instances simultaneously.

Fix: adb kill-server, taskkill /F /IM qemu-system-x86_64.exe, restart one emulator.

Bug 005: Documentation Deletion Incident
Symptoms: PowerShell script deleted docs/ subfolders (01_ARCHITECTURE etc.) due to case-insensitivity (01_ARCHITECTURE == 01_Architecture).

Cause: Windows PowerShell Move-Item behavior.

Fix: Restored files from memory/GitHub, flattened all docs into a single docs/ folder.

09_TESTING_AND_QUALITY.md
Static Analysis: TypeScript check passed (0 errors).

Emulator Testing: App successfully installed and launched on Pixel_7_LIGHT (API 34).

UI Testing: Mobile CSS override works. Dashboard is single column.

Functional Testing: Native storage bridge tested (data persists across app restarts). Back button exits game to dashboard.

Unexecuted Tests: 42 games have not been manually played inside the mobile WebView yet. iOS build not tested.

10_DEPLOYMENT_AND_ENVIRONMENT.md
OS: Windows 11.

Node.js: v24.21.0.

Android SDK: C:\Program Files (x86)\Android\android-sdk.

Emulator: Pixel_7_LIGHT (x86_64, 2GB RAM).

Build Commands:

npx cap sync android

cd android && .\gradlew.bat assembleDebug

adb -e install -r -d "app-debug.apk"

Backend: npm run dev (runs on localhost:3000).

Environment Variables: DATABASE_URL, GROQ_API_KEY, GEMINI_API_KEY, ADMIN_TOKEN, etc.

11_OPEN_ISSUES_AND_ROADMAP.md
Issue	Severity	Next Step
ADB conflicts with VS Code Live Reload	High	Use npx cap run android without extensions, or use Windows snapping.
iOS Build	Medium	Requires macOS. Deferred.
42 Games Mobile Testing	High	Manually test all 42 games on the emulator to ensure touch controls work.
Backend Deployment	Medium	Deploy to Render when mobile is stable.
UI Polish	Low	Improve game touch targets if needed.
12_DECISIONS_AND_CHANGELOG.md
Changelog
v1.0 (Current): Mobile migration completed. Android app builds and runs. Offline mode enabled. Native storage and back button implemented. Docs flattened.

v0.9: Error System implemented. Dashboard modularized.

v0.8: AI features integrated.

v0.1: Backend foundation and 42 games created.

Decisions
Capacitor over React Native: Chosen to preserve 42 Vanilla JS games without a massive rewrite.

public/ folder: Chosen as the Capacitor webDir to isolate mobile assets from source.

Offline Mode: Chosen to prevent localhost crashes on mobile.

13_AI_SESSION_CONTEXT.md
User Preferences
Speaks Egyptian Arabic + Technical English.

Wants Full Files Only (no snippets, no diffs).

Uses تمم (Done), اللي بعدو (Next), كمّل (Continue).

Expects direct, no-BS answers.

Golden Rules
Do not modify migrations 001-023.

Do not break the 8-file pattern.

Do not use frameworks.

No L4 clinical claims.

14_RESUME_CHECKLIST.md
□ Verify environment: npx cap sync android.
□ Start emulator: emulator -avd Pixel_7_LIGHT.
□ Build APK: cd android && .\gradlew.bat assembleDebug.
□ Install app: adb install -r -d "app\build\outputs\apk\debug\app-debug.apk".
□ Launch app: adb shell monkey -p com.flash.app -c android.intent.category.LAUNCHER 1.
□ Test 42 games manually on the emulator.
□ Fix any touch/iframe issues found.
□ Proceed to Feature Development.
NEXT AI — READ THIS FIRST
Project Definition: FLASH is a cognitive training platform with 42 Vanilla JS games, now migrated to Android via Capacitor.

Current State: The Android APK builds successfully (5.91 MB) and runs. Mobile UI, Native Storage, and Back Button are implemented.

Last Completed Task: Flattening the docs/ folder and resolving the accidental deletion of documentation.

Most Important Files: public/index.html, capacitor.config.json, public/js/config.js, public/css/modules/mobile-app.css.

Rules to Preserve: Vanilla JS, 8-file game pattern, Offline-first mobile, no backend dependency on localhost.

Critical Issues: Do NOT run multiple emulators at once (causes ADB offline errors). Ensure JAVA_HOME points to Android Studio's JBR.

First 5 Steps:

Start the emulator (Pixel_7_LIGHT).

Verify app launches.

Test 5 random games.

Fix touch bugs if any.

Run npx cap sync android before making new changes.

Tests to Run: Verify localStorage persists after closing and reopening the app.

Unknowns: iOS build compatibility, long-term backend sync.

Instruction: DO NOT rewrite the 42 games. DO NOT change the architecture. Verify everything on the emulator before claiming success.