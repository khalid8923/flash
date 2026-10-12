# ============================================================
# FLASH - Error System Verification
# ============================================================
$paths = @(
  @{ Name = 'errors.js';            Path = 'D:\Flash\frontend\dashboard\js\lib\errors.js';            Min = 2000 },
  @{ Name = 'safe-fetch.js';        Path = 'D:\Flash\frontend\dashboard\js\lib\safe-fetch.js';        Min = 2000 },
  @{ Name = 'error-ui.css';         Path = 'D:\Flash\frontend\dashboard\css\modules\error-ui.css';    Min = 3000 },
  @{ Name = 'error-ui.js';          Path = 'D:\Flash\frontend\dashboard\js\modules\error-ui.js';      Min = 4000 },
  @{ Name = 'network-monitor.js';   Path = 'D:\Flash\frontend\dashboard\js\modules\network-monitor.js'; Min = 2000 },
  @{ Name = 'save-queue.js';        Path = 'D:\Flash\frontend\dashboard\js\modules\save-queue.js';    Min = 3000 },
  @{ Name = 'backend errors.ts';    Path = 'D:\Flash\backend\src\lib\errors.ts';                      Min = 2000 },
  @{ Name = 'backend handler.ts';   Path = 'D:\Flash\backend\src\lib\error-handler.ts';               Min = 2000 }
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  FLASH - Error System Verification" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$fail = 0
foreach ($f in $paths) {
  if (Test-Path $f.Path) {
    $size = (Get-Item $f.Path).Length
    if ($size -ge $f.Min) {
      Write-Host ("  [OK]   {0,-24} {1} bytes" -f $f.Name, $size) -ForegroundColor Green
    } else {
      Write-Host ("  [WARN] {0,-24} {1} bytes (expected >= {2})" -f $f.Name, $size, $f.Min) -ForegroundColor Yellow
      $fail++
    }
  } else {
    Write-Host ("  [FAIL] {0,-24} MISSING" -f $f.Name) -ForegroundColor Red
    $fail++
  }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  HTML integration check" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$html = Get-Content 'D:\Flash\frontend\dashboard\index.html' -Raw
$checks = @(
  @{ Name = 'errors.js linked';         Pattern = 'lib/errors.js' },
  @{ Name = 'safe-fetch.js linked';     Pattern = 'lib/safe-fetch.js' },
  @{ Name = 'error-ui.css linked';      Pattern = 'error-ui.css' },
  @{ Name = 'error-ui.js linked';       Pattern = 'modules/error-ui.js' },
  @{ Name = 'network-monitor linked';   Pattern = 'network-monitor.js' },
  @{ Name = 'save-queue linked';        Pattern = 'save-queue.js' }
)

foreach ($c in $checks) {
  if ($html -match [regex]::Escape($c.Pattern)) {
    Write-Host ("  [OK]   {0}" -f $c.Name) -ForegroundColor Green
  } else {
    Write-Host ("  [FAIL] {0}" -f $c.Name) -ForegroundColor Red
    $fail++
  }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Backend integration check" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$serverTs = Get-Content 'D:\Flash\backend\src\server.ts' -Raw
if ($serverTs -match 'registerErrorHandler') {
  Write-Host "  [OK]   server.ts imports and calls registerErrorHandler" -ForegroundColor Green
} else {
  Write-Host "  [FAIL] server.ts missing registerErrorHandler" -ForegroundColor Red
  $fail++
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
if ($fail -eq 0) {
  Write-Host "  ALL CHECKS PASSED" -ForegroundColor Green
} else {
  Write-Host ("  {0} CHECK(S) FAILED" -f $fail) -ForegroundColor Red
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""