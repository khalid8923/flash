# FLASH - Health Split Test
# Run: .\test-health.ps1

cd D:\Flash\backend
Write-Host "`n[TEST] Health Split" -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

$job = Start-Job -ScriptBlock {
    Set-Location "D:\Flash\backend"
    npx tsx src/server.ts
}
Start-Sleep -Seconds 6

$fail = 0

# ---- /health (liveness, no DB) ----
Write-Host "`n[1] GET /health (liveness)" -ForegroundColor Yellow
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $h = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    $sw.Stop()
    $ms = $sw.ElapsedMilliseconds

    if ($h.ok -eq $true -and $h.service -eq 'flash-backend') {
        Write-Host ("  [PASS] ok=true, service={0}, version={1}, {2}ms" -f $h.service, $h.version, $ms) -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] unexpected payload" -ForegroundColor Red
        $fail++
    }
    if ($ms -lt 100) {
        Write-Host ("  [PASS] fast ({0}ms < 100ms) - no DB touch" -f $ms) -ForegroundColor Green
    } else {
        Write-Host ("  [WARN] slow ({0}ms) - check DB usage" -f $ms) -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# ---- /ready (readiness, with DB) ----
Write-Host "`n[2] GET /ready (readiness)" -ForegroundColor Yellow
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $r = Invoke-RestMethod -Uri "http://localhost:3000/ready" -TimeoutSec 10
    $sw.Stop()
    $ms = $sw.ElapsedMilliseconds

    if ($r.ok -eq $true -and $r.db.reachable -eq $true) {
        Write-Host ("  [PASS] db reachable, ping={0}ms, migrations={1}, games={2}, total={3}ms" -f $r.db.ping_ms, $r.db.migrations, $r.db.games, $ms) -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] unexpected payload" -ForegroundColor Red
        $fail++
    }
    if ($r.db.migrations -eq 12) {
        Write-Host "  [PASS] 12 migrations (as expected)" -ForegroundColor Green
    } else {
        Write-Host ("  [WARN] migrations={0} (expected 12)" -f $r.db.migrations) -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host ""
if ($fail -eq 0) {
    Write-Host "  [ALL PASS] Health split works correctly" -ForegroundColor Green
} else {
    Write-Host "  [$fail FAILED]" -ForegroundColor Red
}
Write-Host "`n[DONE]`n" -ForegroundColor Cyan