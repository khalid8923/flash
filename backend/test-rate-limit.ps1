# FLASH - Rate Limit Test (R11) - uses curl.exe for speed
# Run: .\test-rate-limit.ps1

cd D:\Flash\backend
Write-Host "`n[TEST] Rate Limiting" -ForegroundColor Cyan

# Check curl available
$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if (-not $curl) {
    Write-Host "  [SKIP] curl.exe not found (Windows 10+ required)" -ForegroundColor Yellow
    exit 0
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

$job = Start-Job -ScriptBlock {
    Set-Location "D:\Flash\backend"
    npx tsx src/server.ts
}
Start-Sleep -Seconds 8

$fail = 0

# ---- 1) Headers present ----
Write-Host "`n[1] X-RateLimit-* headers" -ForegroundColor Yellow
$headersRaw = curl.exe -s -D - -o NUL "http://localhost:3000/games"
$limit = ($headersRaw | Select-String -Pattern 'x-ratelimit-limit:\s*(\d+)').Matches.Groups[1].Value
$remaining = ($headersRaw | Select-String -Pattern 'x-ratelimit-remaining:\s*(\d+)').Matches.Groups[1].Value
if ($limit -and $remaining) {
    Write-Host ("  [PASS] limit={0}, remaining={1}" -f $limit, $remaining) -ForegroundColor Green
} else {
    Write-Host "  [FAIL] rate limit headers missing" -ForegroundColor Red
    $fail++
}

# ---- 2) /health bypasses ----
Write-Host "`n[2] /health bypasses rate limit" -ForegroundColor Yellow
$healthHeaders = curl.exe -s -D - -o NUL "http://localhost:3000/health"
$hLimit = ($healthHeaders | Select-String -Pattern 'x-ratelimit-limit').Matches.Count
if ($hLimit -eq 0) {
    Write-Host "  [PASS] /health NOT rate limited" -ForegroundColor Green
} else {
    Write-Host "  [WARN] /health has rate limit headers" -ForegroundColor Yellow
}

# ---- 3) Burst with curl ----
Write-Host "`n[3] Burst 250 requests with curl.exe" -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$got429 = $false
$count = 0
for ($i = 1; $i -le 250; $i++) {
    $count = $i
    $status = curl.exe -s -o NUL -w "%{http_code}" "http://localhost:3000/domains"
    if ($i % 50 -eq 0) {
        $elapsed = [math]::Round($sw.Elapsed.TotalSeconds, 1)
        Write-Host ("    after {0} reqs: status={1} ({2}s)" -f $i, $status, $elapsed) -ForegroundColor Gray
    }
    if ($status -eq '429') {
        $sw.Stop()
        Write-Host ("  [PASS] 429 after {0} requests in {1}s" -f $i, [math]::Round($sw.Elapsed.TotalSeconds, 1)) -ForegroundColor Green
        $got429 = $true
        break
    }
}
if (-not $got429) {
    Write-Host ("  [FAIL] no 429 after {0} requests in {1}s" -f $count, [math]::Round($sw.Elapsed.TotalSeconds, 1)) -ForegroundColor Red
    $fail++
}

# ---- 4) 429 response details ----
if ($got429) {
    Write-Host "`n[4] 429 response details" -ForegroundColor Yellow
    $out = curl.exe -s -D - -w "`nSTATUS:%{http_code}" "http://localhost:3000/domains"
    $status = ($out | Select-String -Pattern 'STATUS:(\d+)').Matches.Groups[1].Value
    $retry = ($out | Select-String -Pattern 'retry-after:\s*(\d+)').Matches.Groups[1].Value
    $body = ($out -join "`n")

    if ($status -eq '429') {
        Write-Host "  [PASS] still 429" -ForegroundColor Green
    } else {
        Write-Host ("  [WARN] status={0}" -f $status) -ForegroundColor Yellow
    }
    if ($retry) {
        Write-Host ("  [PASS] Retry-After={0}s" -f $retry) -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Retry-After missing" -ForegroundColor Yellow
    }
    if ($body -match 'rate_limit_exceeded') {
        Write-Host "  [PASS] body has rate_limit_exceeded" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] body missing rate_limit_exceeded" -ForegroundColor Yellow
    }
}

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host ""
if ($fail -eq 0) {
    Write-Host "  [ALL PASS] Rate limiting works" -ForegroundColor Green
} else {
    Write-Host ("  [{0} FAILED]" -f $fail) -ForegroundColor Red
}
Write-Host "`n[DONE]`n" -ForegroundColor Cyan