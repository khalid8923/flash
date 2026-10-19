param(
    [Parameter(Mandatory=$true)]
    [string]$Domain, # e.g., "memory"
    
    [Parameter(Mandatory=$true)]
    [string]$GameId, # e.g., "new-memory-game"
    
    [Parameter(Mandatory=$true)]
    [string]$GameName # e.g., "New Memory Game"
)

$GAMES_DIR = "D:\Flash\frontend\games"
$GameDir = Join-Path $GAMES_DIR "$Domain\$GameId"

if (Test-Path $GameDir) {
    Write-Host "Game already exists at $GameDir" -ForegroundColor Red
    exit
}

Write-Host "Generating files for $GameName in $Domain..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $GameDir -Force | Out-Null

# --- 1. config.json ---
$configJson = @"
{
  "id": "$GameId",
  "name": "$GameName",
  "domain": "$Domain",
  "icon": "🎮",
  "description": "A new cognitive game.",
  "difficulty": 3,
  "maxLevel": 15,
  "metrics": ["maxLevel", "accuracy", "medianRT"],
  "modes": ["classic", "speed", "endless", "precision", "daily"],
  "features": ["shared-stages", "shared-settings", "shared-i18n", "missions", "badges", "postmessage"]
}
"@
Set-Content -Path "$GameDir\config.json" -Value $configJson -Encoding UTF8

# --- 2. game.html ---
$gameHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>$GameName — FLASH</title>
<link rel="stylesheet" href="../../../fonts/space-grotesk.css">
<link rel="stylesheet" href="../../../fonts/jetbrains-mono.css">
<link rel="stylesheet" href="game.css">
</head>
<body>
<div id="game-root">
  <header class="g-header">
    <div class="g-logo"><span class="g-logo-icon">⚡</span><span class="g-logo-text">FLASH</span></div>
    <div class="g-meta">
      <span class="g-meta-item"><span class="g-meta-label">LEVEL</span><span class="g-meta-value" id="level-display">1</span></span>
      <span class="g-meta-item"><span class="g-meta-label">SCORE</span><span class="g-meta-value" id="score-display">0</span></span>
    </div>
    <button class="g-settings-btn" id="settings-btn">⚙</button>
  </header>
  <main id="stage" class="stage" data-phase="idle">
    <div class="stage-inner"><div id="phase-content"></div></div>
  </main>
  <footer class="g-footer"><div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div></footer>
</div>
<script src="../../../shared/i18n.js"></script>
<script src="../../../shared/settings.js"></script>
<script src="../../../shared/flash-stages.js"></script>
<script src="$GameId-stages.js"></script>
<script src="$GameId-helpers.js"></script>
<script src="$GameId-sounds.js"></script>
<script src="$GameId-extra-modes.js"></script>
<script src="game.js"></script>
</body>
</html>
"@
Set-Content -Path "$GameDir\game.html" -Value $gameHtml -Encoding UTF8

# --- 3. game.css (Basic Template) ---
$gameCss = @"
:root { --bg: #FFF1F2; --tx: #1F2937; --ac: #EC4899; }
body { background: var(--bg); color: var(--tx); font-family: 'Space Grotesk', sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
#game-root { width: 100%; max-width: 600px; padding: 20px; text-align: center; }
.g-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
"@
Set-Content -Path "$GameDir\game.css" -Value $gameCss -Encoding UTF8

# --- 4. game.js (Basic Boilerplate) ---
$gameJs = @"
(function() {
  'use strict';
  const T = window.FLASH_I18N || { t: (k) => k };
  const FS = window.FlashSettings;
  const FlashStages = window.FlashStages;

  if (FlashStages) FlashStages.init('$GameId', window.${GameId}Stages || []);
  
  function init() {
    document.getElementById('phase-content').innerHTML = '<h1>$GameName</h1><p>Game logic goes here</p>';
  }
  document.addEventListener('DOMContentLoaded', init);
})();
"@
Set-Content -Path "$GameDir\game.js" -Value $gameJs -Encoding UTF8

# --- 5. Boilerplate files for helpers, sounds, stages, extra-modes ---
$boilerplate = "// Boilerplate for ${GameId}"
Set-Content -Path "$GameDir\$GameId-helpers.js" -Value $boilerplate -Encoding UTF8
Set-Content -Path "$GameDir\$GameId-sounds.js" -Value $boilerplate -Encoding UTF8
Set-Content -Path "$GameDir\$GameId-extra-modes.js" -Value $boilerplate -Encoding UTF8
Set-Content -Path "$GameDir\$GameId-stages.js" -Value "window.${GameId}Stages = [];" -Encoding UTF8

Write-Host "✅ Game $GameName created successfully!" -ForegroundColor Green
Write-Host "Location: $GameDir" -ForegroundColor Cyan
