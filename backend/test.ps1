# ═══════════════════════════════════════════════════════════
# FLASH Backend - Master Test (Sprint 0 FINAL)
# Run: .\test.ps1
# Behavior: displays results, copies to clipboard, plays beep
# ═══════════════════════════════════════════════════════════
$fail = 0
$results = @()
$plainLines = New-Object System.Collections.ArrayList

function Add-Result {
    param([string]$Name, [bool]$Pass)
    $script:results += @{Name=$Name; Pass=$Pass}
    if (-not $Pass) { $script:fail++ }
}

# ---- STEP 2: Cleanup ----
$bakCount = (Get-ChildItem .\src -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '\.bak\d*$' }).Count
Add-Result ".bak* files deleted (0 expected)" ($bakCount -eq 0)

$debugCount = (Get-ChildItem . -File | Where-Object { 
    $_.Name -match "^(check-|audit\.|verify-seed|dev\.log|errors-files|ts-errors|SNAPSHOT|SPRINT1_SNAPSHOT)" 
}).Count
Add-Result "Debug files in root cleared" ($debugCount -eq 0)

Add-Result "src/plugins removed" (-not (Test-Path ".\src\plugins"))

$scriptFiles = @('audit-db.ts', 'verify-catalog.ts', 'verify-db.ts', 'verify-seed.ts')
$missingScripts = $scriptFiles | Where-Object { -not (Test-Path ".\scripts\$_") }
Add-Result "scripts/ has 4 expected files" ($missingScripts.Count -eq 0)

# ---- STEP 3: env.ts ----
Add-Result "env.ts: GEMINI_MODEL=gemini-2.0-flash" ((Select-String -Path ".\src\config\env.ts" -Pattern "GEMINI_MODEL.*gemini-2\.0-flash" -Quiet) -eq $true)
Add-Result "env.ts: OPENROUTER_MODEL updated" ((Select-String -Path ".\src\config\env.ts" -Pattern "OPENROUTER_MODEL.*google/gemini-2\.0-flash-exp:free" -Quiet) -eq $true)
Add-Result "env.ts: no old patterns" (-not (Select-String -Path ".\src\config\env.ts" -Pattern "gemini-3\.8-flash" -Quiet))

# ---- STEP 4: game.template.html ----
$tplPath = "D:\Flash\frontend\shared\templates\game.template.html"
if (Test-Path $tplPath) {
    $tpl = Get-Content $tplPath -Raw -Encoding UTF8
    Add-Result "game.template.html: 8 scripts" (([regex]::Matches($tpl, '<script\s+src=')).Count -eq 8)
    Add-Result "game.template.html: i18n + settings loaded" (($tpl -match 'shared/i18n\.js') -and ($tpl -match 'shared/settings\.js'))
} else {
    Add-Result "game.template.html exists" $false
}

# ---- STEP 5: Root files ----
$gi = if (Test-Path ".\.gitignore") { Get-Content ".\.gitignore" -Raw -Encoding UTF8 } else { "" }
Add-Result ".gitignore: has .env + !.env.example" (($gi -match '\.env') -and ($gi -match '!\.env\.example'))
Add-Result ".gitignore: has .bak + .log" (($gi -match '\.bak') -and ($gi -match '\.log'))

$ee = if (Test-Path ".\.env.example") { Get-Content ".\.env.example" -Raw -Encoding UTF8 } else { "" }
Add-Result ".env.example: GROQ_MODEL_EN set" ($ee -match 'GROQ_MODEL_EN=openai/gpt-oss-120b')
Add-Result ".env.example: OPENROUTER + GEMINI updated" (($ee -match 'OPENROUTER_MODEL=google/gemini-2\.0-flash-exp:free') -and ($ee -match 'GEMINI_MODEL=gemini-2\.0-flash'))
Add-Result ".env.example: VOICE + ADMIN_TOKEN" (($ee -match 'VOICE_MODEL=') -and ($ee -match 'ADMIN_TOKEN='))

Add-Result "SECURITY.md exists" (Test-Path ".\SECURITY.md")

# ---- TypeScript ----
$tsErrors = (npx tsc --noEmit 2>&1 | Select-String "error TS").Count
Add-Result "TypeScript: 0 errors" ($tsErrors -eq 0)

# ---- Render (colored) + build plain text ----
$allPass = ($fail -eq 0)
$color = if ($allPass) { "Green" } else { "Red" }
$title = if ($allPass) { "SPRINT 0: ALL TESTS PASSED" } else { "SPRINT 0: $fail TEST(S) FAILED" }
$face  = if ($allPass) { "(0_-||-_0) OK" } else { "(0_-||-_0) FAIL" }
$line = "#=========================================================#"
$pad  = "#                                                         #"

Write-Host ""
Write-Host $line -ForegroundColor $color
Write-Host $pad  -ForegroundColor $color
Write-Host ("#  " + $title.PadRight(53) + "  #") -ForegroundColor $color
Write-Host $pad  -ForegroundColor $color
Write-Host $line -ForegroundColor $color

$plainLines.Add($line) | Out-Null
$plainLines.Add($title) | Out-Null
$plainLines.Add($line) | Out-Null

foreach ($r in $results) {
    $mark = if ($r.Pass) { "[PASS]" } else { "[FAIL]" }
    $rowColor = if ($r.Pass) { "Green" } else { "Red" }
    Write-Host ("#  " + $mark + " " + $r.Name.PadRight(53) + "  #") -ForegroundColor $rowColor
    $plainLines.Add("$mark $($r.Name)") | Out-Null
}

Write-Host $pad  -ForegroundColor $color
Write-Host $line -ForegroundColor $color
Write-Host ("#              " + $face.PadRight(44) + "  #") -ForegroundColor $color
Write-Host $line -ForegroundColor $color
Write-Host ""

$plainLines.Add($line) | Out-Null
$plainLines.Add($face) | Out-Null
$plainLines.Add($line) | Out-Null

# ---- Clipboard + Beep ----
$plainText = ($plainLines -join "`n")
try {
    Set-Clipboard -Value $plainText
    [System.Media.SystemSounds]::Asterisk.Play() | Out-Null
    Write-Host "  [CLIPBOARD] Output copied - paste to AI" -ForegroundColor Yellow
} catch {
    Write-Host "  [CLIPBOARD] Failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
}

# ---- Exit code ----
if (-not $allPass) { exit 1 }