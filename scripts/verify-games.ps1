# ============================================================
# FLASH - Verify Games
# ============================================================
param([string]$Root = "D:\Flash\frontend\games")

$optional = @('helpers', 'sounds', 'stages', 'extra-modes')
$required = @('game.js', 'game.html', 'game.css', 'config.json')

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  FLASH - Game Completeness Check" -ForegroundColor Cyan
Write-Host "  Root: $Root" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$total = 0
$complete = 0
$incomplete = @()

Get-ChildItem $Root -Directory | ForEach-Object {
    $domainDir = $_
    Get-ChildItem $domainDir.FullName -Directory | ForEach-Object {
        $gameDir = $_
        $gameId = $gameDir.Name

        if ($gameId -match '\.legacy$') { return }
        if ($gameId -eq '_template') { return }
        if ($gameId -eq 'vigilance' -and $domainDir.Name -eq 'games') { return }
        if ($gameId -eq 'word-scramble' -and $domainDir.Name -eq 'games') { return }

        $total++

        $missing = @()
        foreach ($f in $required) {
            if (-not (Test-Path (Join-Path $gameDir.FullName $f))) { $missing += $f }
        }
        foreach ($suffix in $optional) {
            $f = "$gameId-$suffix.js"
            if (-not (Test-Path (Join-Path $gameDir.FullName $f))) { $missing += $f }
        }

        if ($missing.Count -eq 0) {
            $complete++
            Write-Host ("  [OK]   {0,-24} {1}" -f $gameId, $domainDir.Name) -ForegroundColor Green
        } else {
            $incomplete += [PSCustomObject]@{
                Game = $gameId
                Domain = $domainDir.Name
                Missing = ($missing -join ', ')
            }
            Write-Host ("  [WARN] {0,-24} {1} missing: {2}" -f $gameId, $domainDir.Name, ($missing -join ', ')) -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
$color = "Yellow"
if ($complete -eq $total) { $color = "Green" }
Write-Host ("  Total: {0}   Complete: {1}   Incomplete: {2}" -f $total, $complete, ($total - $complete)) -ForegroundColor $color
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($incomplete.Count -gt 0) {
    Write-Host "Missing files detail:" -ForegroundColor Yellow
    $incomplete | Format-Table -AutoSize
}

if ($complete -eq $total) {
    Write-Host "  ALL GAMES COMPLETE" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  SOME GAMES INCOMPLETE" -ForegroundColor Yellow
    exit 1
}