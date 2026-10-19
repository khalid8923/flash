# FEATURE MIGRATION MATRIX
## Games & Core Features (42 Games)

| Feature | Files | Strategy | Status | Test Result |
|---|---|---|---|---|
| Games Engine (iframe) | games/*/game.html | Reuse (Resize iframe to 100%) | ⏳ Testing | - |
| Game postMessage | game-complete-bridge.js | Reuse | ⏳ Testing | - |
| Local Storage | shared/settings.js | Reuse (Needs Native migration later) | ⏳ Testing | - |
| Back Button | (Native Android) | Needs Implementation | ⏳ Pending | - |
| Splash Screen | (Capacitor) | Implemented | ✅ Done | - |

### Known Risks (Per Spec Section 18)
1. **iframe touch events:** Sometimes fail on iOS WKWebView, testing on Android first.
2. **Full screen scaling:** The iframe must fill the screen without scrolling.
