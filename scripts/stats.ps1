# ==========================================================
# FLASH - FULL PROJECT STATS (entire D:\Flash)
# Usage: powershell -ExecutionPolicy Bypass -File stats.ps1
# ==========================================================
param(
  [string]$Root = "D:\Flash"
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FLASH - FULL PROJECT STATS" -ForegroundColor Cyan
Write-Host "  Root: $Root" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# --- Gather (excluding heavy/irrelevant folders) ---
$exclude = '\\node_modules\\|\\\.git\\|\\dist\\|\\build\\|\\\.cache\\|\\backups\\|\\_legacy\\'
$all = Get-ChildItem -Path $Root -Recurse -File -Force |
  Where-Object { $_.FullName -notmatch $exclude }

$fileCount = $all.Count
$folderCount = (Get-ChildItem -Path $Root -Recurse -Directory -Force |
  Where-Object { $_.FullName -notmatch $exclude }).Count
$totalBytes = ($all | Measure-Object -Property Length -Sum).Sum
$kb = [math]::Round($totalBytes / 1KB, 1)
$mb = [math]::Round($totalBytes / 1MB, 2)

Write-Host "  FILES      : $fileCount"
Write-Host "  FOLDERS    : $folderCount"
Write-Host "  SIZE       : {0} MB ({1} KB)" -f $mb, $kb
Write-Host ""

# --- Line counts ---
$textExts = @('.js','.css','.html','.json','.md','.ps1','.txt','.ts','.sql','.yml','.yaml')
$totalLines = 0
$linesByExt = @{}

foreach ($f in $all){
  if ($textExts -contains $f.Extension){
    try {
      $lines = (Get-Content $f.FullName -ErrorAction SilentlyContinue).Count
      $totalLines += $lines
      $ext = $f.Extension.TrimStart('.')
      if (-not $linesByExt[$ext]){ $linesByExt[$ext] = 0 }
      $linesByExt[$ext] += $lines
    } catch {}
  }
}

Write-Host "  LINES      : $totalLines"
Write-Host ""

# --- By extension ---
Write-Host "--- By Extension ---" -ForegroundColor Yellow
$byExt = $all | Group-Object Extension | Sort-Object Count -Descending
foreach ($g in $byExt){
  if ($g.Count -lt 2) { continue }
  $ext = if ($g.Name) { $g.Name } else { "(none)" }
  $size = [math]::Round(($g.Group | Measure-Object Length -Sum).Sum / 1KB, 1)
  $lines = 0
  if ($linesByExt[$g.Name.TrimStart('.')]){
    $lines = $linesByExt[$g.Name.TrimStart('.')]
  }
  Write-Host ("  {0,-8} {1,4} files {2,8} KB {3,8} lines" -f $ext, $g.Count, $size, $lines)
}
Write-Host ""

# --- By top-level folder ---
Write-Host "--- By Top-Level Folder ---" -ForegroundColor Yellow
$topFolders = Get-ChildItem $Root -Directory -Force |
  Where-Object { $_.Name -notmatch '^\.|node_modules|dist|build' }

foreach ($d in $topFolders){
  $files = Get-ChildItem $d.FullName -Recurse -File -Force |
    Where-Object { $_.FullName -notmatch $exclude }
  if ($files.Count -eq 0) { continue }
  $size = [math]::Round(($files | Measure-Object Length -Sum).Sum / 1KB, 1)
  Write-Host ("  {0,-24} {1,5} files {2,10} KB" -f $d.Name, $files.Count, $size)
}

# Root files
$rootFiles = Get-ChildItem $Root -File -Force
if ($rootFiles.Count -gt 0){
  $rsize = [math]::Round(($rootFiles | Measure-Object Length -Sum).Sum / 1KB, 1)
  Write-Host ("  {0,-24} {1,5} files {2,10} KB" -f "(root)", $rootFiles.Count, $rsize)
}
Write-Host ""

# --- Frontend breakdown ---
Write-Host "--- Frontend Breakdown ---" -ForegroundColor Yellow
$fe = "$Root\frontend"
if (Test-Path $fe){
  foreach ($sub in @('dashboard','games','shared')){
    $p = Join-Path $fe $sub
    if (Test-Path $p){
      $fs = Get-ChildItem $p -Recurse -File -Force
      $size = [math]::Round(($fs | Measure-Object Length -Sum).Sum / 1KB, 1)
      Write-Host ("  frontend/{0,-12} {1,5} files {2,10} KB" -f $sub, $fs.Count, $size)
    }
  }
}
Write-Host ""

# --- Backend breakdown ---
Write-Host "--- Backend Breakdown ---" -ForegroundColor Yellow
$be = "$Root\backend"
if (Test-Path $be){
  foreach ($sub in @('src','scripts','test','deploy')){
    $p = Join-Path $be $sub
    if (Test-Path $p){
      $fs = Get-ChildItem $p -Recurse -File -Force |
        Where-Object { $_.FullName -notmatch $exclude }
      $size = [math]::Round(($fs | Measure-Object Length -Sum).Sum / 1KB, 1)
      Write-Host ("  backend/{0,-13} {1,5} files {2,10} KB" -f $sub, $fs.Count, $size)
    }
  }
  # Backend root files
  $beRoot = Get-ChildItem $be -File -Force
  $rs = [math]::Round(($beRoot | Measure-Object Length -Sum).Sum / 1KB, 1)
  Write-Host ("  backend/{0,-13} {1,5} files {2,10} KB" -f "(root)", $beRoot.Count, $rs)
}
Write-Host ""

# --- Games per domain ---
Write-Host "--- Games by Domain ---" -ForegroundColor Yellow
$games = "$Root\frontend\games"
if (Test-Path $games){
  $domains = Get-ChildItem $games -Directory -Force
  $totalGames = 0
  foreach ($d in $domains){
    if ($d.Name -match '^_'){ continue }
    $sub = Get-ChildItem $d.FullName -Directory -Force
    if ($sub.Count -eq 0){ continue }
    Write-Host ("  {0,-16} {1,2} games" -f $d.Name, $sub.Count)
    $totalGames += $sub.Count
  }
  Write-Host ("  {0,-16} {1,2} games total" -f "TOTAL", $totalGames) -ForegroundColor Cyan
}
Write-Host ""

# --- Top 15 largest ---
Write-Host "--- Top 15 Largest Files ---" -ForegroundColor Yellow
$all | Sort-Object Length -Descending | Select-Object -First 15 | ForEach-Object {
  $rel = $_.FullName.Replace($Root + '\', "")
  Write-Host ("  {0,-58} {1,8} B" -f $rel, $_.Length)
}
Write-Host ""

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""