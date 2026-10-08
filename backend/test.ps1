# ═══════════════════════════════════════════════════════════
# FLASH Backend - Master Test
# Run: .\test.ps1
# ═══════════════════════════════════════════════════════════
$fail = 0
$results = @()
$plainLines = New-Object System.Collections.ArrayList

function Add-Check {
    param([string]$Name, [bool]$Pass)
    $script:results += @{Name=$Name; Pass=$Pass}
    if (-not $Pass) { $script:fail++ }
}

# ═══════════════════════════════════════════════════════════
# SPRINT 0 CHECKS
# ═══════════════════════════════════════════════════════════

# Step 2: Cleanup
$bakCount = (Get-ChildItem .\src -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '\.bak\d*$' }).Count
Add-Check ".bak* files deleted" ($bakCount -eq 0)

$debugCount = (Get-ChildItem . -File | Where-Object { 
    $_.Name -match "^(check-|audit\.|verify-seed|dev\.log|errors-files|ts-errors|SNAPSHOT|SPRINT1_SNAPSHOT)" 
}).Count
Add-Check "Debug files in root cleared" ($debugCount -eq 0)

Add-Check "src/plugins removed" (-not (Test-Path ".\src\plugins"))

$scriptFiles = @('audit-db.ts', 'verify-catalog.ts', 'verify-db.ts', 'verify-seed.ts')
$missingScripts = $scriptFiles | Where-Object { -not (Test-Path ".\scripts\$_") }
Add-Check "scripts/ has 4 expected files" ($missingScripts.Count -eq 0)

# Step 3: env.ts
Add-Check "env.ts: GEMINI_MODEL=gemini-2.0-flash" ((Select-String -Path ".\src\config\env.ts" -Pattern "GEMINI_MODEL.*gemini-2\.0-flash" -Quiet) -eq $true)
Add-Check "env.ts: OPENROUTER_MODEL updated" ((Select-String -Path ".\src\config\env.ts" -Pattern "OPENROUTER_MODEL.*google/gemini-2\.0-flash-exp:free" -Quiet) -eq $true)

# Step 4: game.template.html
$tplPath = "D:\Flash\frontend\shared\templates\game.template.html"
if (Test-Path $tplPath) {
    $tpl = Get-Content $tplPath -Raw -Encoding UTF8
    Add-Check "game.template.html: 8 scripts" (([regex]::Matches($tpl, '<script\s+src=')).Count -eq 8)
    Add-Check "game.template.html: i18n + settings" (($tpl -match 'shared/i18n\.js') -and ($tpl -match 'shared/settings\.js'))
} else {
    Add-Check "game.template.html exists" $false
}

# Step 5: Root files
$gi = if (Test-Path ".\.gitignore") { Get-Content ".\.gitignore" -Raw -Encoding UTF8 } else { "" }
Add-Check ".gitignore: .env + !.env.example" (($gi -match '\.env') -and ($gi -match '!\.env\.example'))

$ee = if (Test-Path ".\.env.example") { Get-Content ".\.env.example" -Raw -Encoding UTF8 } else { "" }
Add-Check ".env.example: models set" (($ee -match 'GROQ_MODEL_EN=openai/gpt-oss-120b') -and ($ee -match 'GROQ_MODEL_AR=allam-2-7b'))

Add-Check "SECURITY.md exists" (Test-Path ".\SECURITY.md")

# TypeScript
$tsErrors = (npx tsc --noEmit 2>&1 | Select-String "error TS").Count
Add-Check "TypeScript: 0 errors" ($tsErrors -eq 0)

# ═══════════════════════════════════════════════════════════
# RENDER
# ═══════════════════════════════════════════════════════════
$allPass = ($fail -eq 0)
$color = if ($allPass) { "Green" } else { "Red" }
$title = if ($allPass) { "ALL TESTS PASSED" } else { "$fail TEST(S) FAILED" }
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

# ═══════════════════════════════════════════════════════════
# CLIPBOARD + BEEP (bulletproof)
# ═══════════════════════════════════════════════════════════
$plainText = ($plainLines -join "`r`n")

# Clipboard: try clip.exe first (most reliable)
try {
    $plainText | & clip.exe
    Write-Host "  [CLIPBOARD] Copied via clip.exe" -ForegroundColor Yellow
} catch {
    # Fallback: Set-Clipboard
    try {
        Set-Clipboard -Value $plainText
        Write-Host "  [CLIPBOARD] Copied via Set-Clipboard" -ForegroundColor Yellow
    } catch {
        Write-Host "  [CLIPBOARD] Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Beep: console.beep (direct driver)
try {
    [console]::beep(880, 150)
    Start-Sleep -Milliseconds 80
    [console]::beep(1200, 220)
    Write-Host "  [BEEP] Signal played" -ForegroundColor Yellow
} catch {
    Write-Host "  [BEEP] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

if (-not $allPass) { exit 1 }