# FLASH - Catalog Cache Test (PowerShell 5.1 compatible)
# Run: .\test-catalog.ps1

cd D:\Flash\backend
Write-Host "`n[TEST] Catalog Cache" -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

$job = Start-Job -ScriptBlock {
    Set-Location "D:\Flash\backend"
    npx tsx src/server.ts
}
Start-Sleep -Seconds 8

$fail = 0

# ---- 1st request: fresh ----
Write-Host "`n[1] /games (1st - fresh)" -ForegroundColor Yellow
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $r1 = Invoke-WebRequest -Uri "http://localhost:3000/games" -UseBasicParsing
    $sw.Stop()
    $ms1 = $sw.ElapsedMilliseconds
    $etag = $r1.Headers['etag']
    $cc = $r1.Headers['cache-control']
    Write-Host ("  status={0}, {1}ms, etag={2}" -f $r1.StatusCode, $ms1, $etag) -ForegroundColor Green
    Write-Host ("  cache-control={0}" -f $cc) -ForegroundColor Green
    if ($etag) {
        Write-Host "  [PASS] ETag present" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] no ETag" -ForegroundColor Red
        $fail++
    }
    if ($cc -match 'public') {
        Write-Host "  [PASS] Cache-Control present" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] no Cache-Control" -ForegroundColor Red
        $fail++
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# ---- 2nd request: cache hit ----
Write-Host "`n[2] /games (2nd - cache hit)" -ForegroundColor Yellow
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $r2 = Invoke-WebRequest -Uri "http://localhost:3000/games" -UseBasicParsing
    $sw.Stop()
    $ms2 = $sw.ElapsedMilliseconds
    Write-Host ("  status={0}, {1}ms" -f $r2.StatusCode, $ms2) -ForegroundColor Green
    if ($ms2 -lt $ms1) {
        Write-Host ("  [PASS] faster than 1st ({0}ms -> {1}ms)" -f $ms1, $ms2) -ForegroundColor Green
    } else {
        Write-Host ("  [WARN] not faster ({0}ms -> {1}ms)" -f $ms1, $ms2) -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# ---- 3rd: conditional 304 (PS 5.1 -> catch WebException) ----
Write-Host "`n[3] /games (3rd - If-None-Match -> 304)" -ForegroundColor Yellow
try {
    $r3 = Invoke-WebRequest -Uri "http://localhost:3000/games" `
        -Headers @{ 'If-None-Match' = $etag } `
        -UseBasicParsing
    # If we get here, status != 304
    Write-Host ("  [FAIL] status={0} (expected 304)" -f $r3.StatusCode) -ForegroundColor Red
    $fail++
} catch {
    # WebException for non-2xx
    $resp = $null
    if ($_.Exception.PSObject.Properties['Response'] -and $_.Exception.Response) {
        $resp = $_.Exception.Response
    }
    if ($resp -and [int]$resp.StatusCode -eq 304) {
        Write-Host "  [PASS] status=304 (Not Modified)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] unexpected exception: $($_.Exception.Message)" -ForegroundColor Red
        $fail++
    }
}

# ---- 4th: /domains ----
Write-Host "`n[4] /domains (1st then 2nd)" -ForegroundColor Yellow
try {
    $d1sw = [System.Diagnostics.Stopwatch]::StartNew()
    $d1 = Invoke-WebRequest -Uri "http://localhost:3000/domains" -UseBasicParsing
    $d1sw.Stop()
    $d2sw = [System.Diagnostics.Stopwatch]::StartNew()
    $d2 = Invoke-WebRequest -Uri "http://localhost:3000/domains" -UseBasicParsing
    $d2sw.Stop()
    Write-Host ("  /domains 1st={0}ms, 2nd={1}ms, etag={2}" -f $d1sw.ElapsedMilliseconds, $d2sw.ElapsedMilliseconds, $d1.Headers['etag']) -ForegroundColor Green
    if ($d1.Headers['etag']) {
        Write-Host "  [PASS] /domains has ETag" -ForegroundColor Green
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
    Write-Host "  [ALL PASS] Catalog caching works" -ForegroundColor Green
} else {
    Write-Host ("  [{0} FAILED]" -f $fail) -ForegroundColor Red
}
Write-Host "`n[DONE]`n" -ForegroundColor Cyan