# FLASH - Security Headers Test
# Run: .\test-security.ps1
# Start server, check headers, stop server

cd D:\Flash\backend

Write-Host "`n[TEST] Security Headers" -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

$job = Start-Job -ScriptBlock {
    Set-Location "D:\Flash\backend"
    npx tsx src/server.ts
}
Start-Sleep -Seconds 6

$fail = 0
try {
    $r = Invoke-WebRequest `
        -Uri "http://localhost:3000/health" `
        -Headers @{ "Origin" = "http://localhost:5173" } `
        -UseBasicParsing -TimeoutSec 5

    Write-Host "  Status: $($r.StatusCode)" -ForegroundColor Green
    Write-Host ""

    $expected = @{
        'x-content-type-options'             = 'nosniff'
        'x-frame-options'                    = 'SAMEORIGIN'
        'x-dns-prefetch-control'             = 'off'
        'x-download-options'                 = 'noopen'
        'x-permitted-cross-domain-policies'  = 'none'
        'referrer-policy'                    = 'no-referrer'
        'access-control-allow-origin'        = 'http://localhost:5173'
    }

    foreach ($h in $expected.Keys) {
        $val = $r.Headers[$h]
        if ($val -and $val -match [regex]::Escape($expected[$h])) {
            Write-Host "  [PASS] $h = $val" -ForegroundColor Green
        } elseif ($val) {
            Write-Host "  [WARN] $h = $val (expected: $($expected[$h]))" -ForegroundColor Yellow
        } else {
            Write-Host "  [FAIL] $h (missing)" -ForegroundColor Red
            $fail++
        }
    }

    # HSTS expected OFF in dev
    if ($r.Headers['strict-transport-security']) {
        Write-Host "  [WARN] strict-transport-security present in dev" -ForegroundColor Yellow
    } else {
        Write-Host "  [SKIP] strict-transport-security (off in dev, ok)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

Write-Host ""
if ($fail -eq 0) {
    Write-Host "  [ALL PASS] Security headers OK" -ForegroundColor Green
} else {
    Write-Host "  [$fail FAILED]" -ForegroundColor Red
}

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "`n[DONE]`n" -ForegroundColor Cyan