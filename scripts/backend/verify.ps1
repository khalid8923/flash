$ErrorActionPreference = "Continue"
Set-Location "D:\Flash\backend"

function Line { Write-Host "=========================================" -ForegroundColor Red }
function H1   { param($t) Write-Host ""; Write-Host $t -ForegroundColor Cyan }
function OK   { param($t) Write-Host "  [OK]   $t" -ForegroundColor Green }
function FAIL { param($t) Write-Host "  [FAIL] $t" -ForegroundColor Red }
function INFO { param($t) Write-Host "  [INFO] $t" -ForegroundColor Gray }

$failCount = 0

# 1. Files
Line
H1 "1. Files"
$files = @(
  "src\catalog\types.ts",
  "src\catalog\_meta.ts",
  "src\catalog\_migrate.ts",
  "src\catalog\registry.ts",
  "src\catalog\index.ts",
  "src\services\catalog-sync.ts",
  "src\scripts\sync-catalog.ts",
  "src\routes\admin-catalog.ts",
  "scripts\verify-catalog.ts",
  "scripts\verify-db.ts"
)
foreach ($f in $files) {
  if (Test-Path $f) { OK $f } else { FAIL "$f"; $failCount++ }
}
$games = @(Get-ChildItem "src\catalog\games\*.ts" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "_*" })
INFO "Generated games: $($games.Count)"

# 2. TypeScript
Line
H1 "2. TypeScript"
$tsOut = npx tsc --noEmit 2>&1 | Out-String
$tsCount = ([regex]::Matches($tsOut, "error TS")).Count
if ($tsCount -eq 0) { OK "0 errors" } else { FAIL "$tsCount errors"; $failCount++ }

# 3. Catalog Registry
Line
H1 "3. Catalog"
$catOut = npx tsx scripts/verify-catalog.ts 2>&1 | Out-String
if ($catOut -match "PASS") {
  $n = [regex]::Match($catOut, "COUNT:(\d+)").Groups[1].Value
  OK "All $n games valid"
} else { FAIL "Catalog check failed"; $failCount++ }

# 4. Database
Line
H1 "4. Database"
$dbOut = npx tsx scripts/verify-db.ts 2>&1 | Out-String
if ($dbOut -match "DB_OK") {
  $games = [regex]::Match($dbOut, "GAMES:(\d+)").Groups[1].Value
  $weights = [regex]::Match($dbOut, "WEIGHTS:(\d+)").Groups[1].Value
  $levels = [regex]::Match($dbOut, "LEVELS:(\d+)").Groups[1].Value
  $migs = [regex]::Match($dbOut, "MIGRATIONS:(\d+)").Groups[1].Value
  $ping = [regex]::Match($dbOut, "PING:(\d+)").Groups[1].Value
  OK "DB reachable - $games games"
  INFO "Weights: $weights | Levels: $levels | Migrations: $migs | Ping: ${ping}ms"
} else { FAIL "DB not reachable"; $failCount++ }

# 5. Admin routes registered
Line
H1 "5. Admin Routes"
$hasAdmin = Select-String -Path "src\server.ts" -Pattern "adminCatalogRoutes" -Quiet
if ($hasAdmin) { OK "adminCatalogRoutes registered" } else { FAIL "NOT registered"; $failCount++ }

$hasEnv = Select-String -Path ".env" -Pattern "ADMIN_TOKEN" -Quiet
if ($hasEnv) { OK "ADMIN_TOKEN in .env" } else { FAIL "ADMIN_TOKEN missing"; $failCount++ }

# Summary
Line
if ($failCount -eq 0) {
  Write-Host "  ALL CHECKS PASSED" -ForegroundColor Green
} else {
  Write-Host "  $failCount CHECK(S) FAILED" -ForegroundColor Red
}
Line