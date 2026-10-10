# ==========================================================
# FLASH - Project Stats (ASCII-safe)
# Usage: powershell -ExecutionPolicy Bypass -File stats.ps1
# ==========================================================
param(
  [string]$Root = "D:\Flash\frontend\dashboard"
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FLASH DASHBOARD - PROJECT STATS" -ForegroundColor Cyan
Write-Host "  Root: $Root" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# --- Gather files ---
$all = Get-ChildItem -Path $Root -Recurse -File -Force |
  Where-Object { $_.FullName -notmatch '\\backups\\|\\.git\\' }

$fileCount = $all.Count
$folderCount = (Get-ChildItem -Path $Root -Recurse -Directory -Force).Count
$totalBytes = ($all | Measure-Object -Property Length -Sum).Sum
$kb = [math]::Round($totalBytes / 1KB, 1)
$mb = [math]::Round($totalBytes / 1MB, 2)

Write-Host "  FILES      : $fileCount"
Write-Host "  FOLDERS    : $folderCount"
Write-Host "  SIZE       : {0} MB ({1} KB)" -f $mb, $kb
Write-Host ""

# --- Count lines ---
$textExts = @('.js','.css','.html','.json','.md','.ps1','.txt')
$totalLines = 0
$linesByExt = @{}

foreach ($f in $all){
  if ($textExts -contains $f.Extension){
    try {
      $lineCount = (Get-Content $f.FullName -ErrorAction SilentlyContinue).Count
      $totalLines += $lineCount
      $ext = $f.Extension.TrimStart('.')
      if (-not $linesByExt[$ext]){
        $linesByExt[$ext] = 0
      }
      $linesByExt[$ext] += $lineCount
    } catch {}
  }
}

Write-Host "  LINES      : $totalLines"
Write-Host ""

# --- By extension ---
Write-Host "--- By Extension ---" -ForegroundColor Yellow
$byExt = $all | Group-Object Extension | Sort-Object Count -Descending
foreach ($g in $byExt){
  $ext = if ($g.Name) { $g.Name } else { "(none)" }
  $size = [math]::Round(($g.Group | Measure-Object Length -Sum).Sum / 1KB, 1)
  $lines = 0
  if ($linesByExt[$g.Name.TrimStart('.')]){
    $lines = $linesByExt[$g.Name.TrimStart('.')]
  }
  Write-Host ("  {0,-8} {1,4} files {2,8} KB {3,8} lines" -f $ext, $g.Count, $size, $lines)
}
Write-Host ""

# --- By folder ---
Write-Host "--- By Folder ---" -ForegroundColor Yellow
foreach ($sub in @('css','js')){
  $p = Join-Path $Root $sub
  if (Test-Path $p){
    $fs = Get-ChildItem $p -Recurse -File
    $size = [math]::Round(($fs | Measure-Object Length -Sum).Sum / 1KB, 1)
    Write-Host ("  {0,-8} {1,4} files {2,8} KB" -f $sub, $fs.Count, $size)
  }
}
$rootFiles = Get-ChildItem $Root -File
$rsize = [math]::Round(($rootFiles | Measure-Object Length -Sum).Sum / 1KB, 1)
Write-Host ("  {0,-8} {1,4} files {2,8} KB" -f "(root)", $rootFiles.Count, $rsize)
Write-Host ""

# --- Top 10 largest ---
Write-Host "--- Top 10 Largest Files ---" -ForegroundColor Yellow
$all | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object {
  $rel = $_.FullName.Replace($Root + '\', "")
  Write-Host ("  {0,-52} {1,8} B" -f $rel, $_.Length)
}
Write-Host ""

# --- Module counts ---
$cssMods = (Get-ChildItem "$Root\css\modules" -File).Count
$jsMods  = (Get-ChildItem "$Root\js\modules" -File).Count
$panelsCss = (Get-ChildItem "$Root\css\panels" -File).Count

Write-Host "--- Modules ---" -ForegroundColor Yellow
Write-Host "  css/modules : $cssMods files"
Write-Host "  css/panels  : $panelsCss files"
Write-Host "  js/modules  : $jsMods files"
Write-Host ""

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""