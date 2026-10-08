# FLASH Project Tree with Folder Sizes
$root = "D:\Flash"
$output = "D:\Flash\docs\PROJECT_TREE.md"
$utf8 = New-Object System.Text.UTF8Encoding $false

$exclude = @("node_modules", ".git", "dist", "build", ".next", "coverage", "backend-old")

function Test-Excluded($path) {
    foreach ($ex in $exclude) {
        if ($path -match [regex]::Escape($ex)) { return $true }
    }
    return $false
}

function Format-Size($bytes) {
    if ($bytes -ge 1MB) { return "$([math]::Round($bytes / 1MB, 2)) MB" }
    if ($bytes -ge 1KB) { return "$([math]::Round($bytes / 1KB, 1)) KB" }
    return "$bytes B"
}

function Get-FolderStats($folderPath) {
    $files = @(Get-ChildItem $folderPath -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { -not (Test-Excluded $_.FullName) })
    $size = ($files | Measure-Object -Property Length -Sum).Sum
    if ($null -eq $size) { $size = 0 }
    return @{
        Files = $files.Count
        Size = $size
    }
}ْ

$md = New-Object System.Collections.ArrayList
[void]$md.Add("# FLASH - Project Tree")
[void]$md.Add("")
[void]$md.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$md.Add("")
[void]$md.Add("Size format: [Files count] | [Total size]")
[void]$md.Add("")
[void]$md.Add("``````")
[void]$md.Add("")

# Root stats
$rootStats = Get-FolderStats $root
[void]$md.Add("D:\Flash\  [$($rootStats.Files) files | $(Format-Size $rootStats.Size)]")
[void]$md.Add("")

function Print-Tree($path, $prefix) {
    $items = @(Get-ChildItem $path -Force -ErrorAction SilentlyContinue | Where-Object { -not (Test-Excluded $_.FullName) })
    $dirs = @($items | Where-Object { $_.PSIsContainer } | Sort-Object Name)
    $files = @($items | Where-Object { -not $_.PSIsContainer } | Sort-Object Name)

    $all = @()
    foreach ($d in $dirs) { $all += [PSCustomObject]@{ Item = $d; IsDir = $true } }
    foreach ($f in $files) { $all += [PSCustomObject]@{ Item = $f; IsDir = $false } }

    for ($i = 0; $i -lt $all.Count; $i++) {
        $entry = $all[$i]
        $item = $entry.Item
        $isLast = ($i -eq $all.Count - 1)
        $branch = if ($isLast) { "\\-- " } else { "|-- " }
        $childPrefix = if ($isLast) { "    " } else { "|   " }

        if ($entry.IsDir) {
            $stats = Get-FolderStats $item.FullName
            $line = "$prefix$branch$($item.Name)\  [$($stats.Files) files | $(Format-Size $stats.Size)]"
            [void]$md.Add($line)
            Print-Tree $item.FullName ($prefix + $childPrefix)
        } else {
            $size = Format-Size $item.Length
            $line = "$prefix$branch$($item.Name)  ($size)"
            [void]$md.Add($line)
        }
    }
}

Print-Tree $root ""

[void]$md.Add("")
[void]$md.Add("``````")
[void]$md.Add("")
[void]$md.Add("## Legend")
[void]$md.Add("")
[void]$md.Add("- Each folder shows: **[Files count] | [Total size]**")
[void]$md.Add("- Each file shows: **(size)**")
[void]$md.Add("- Excluded: node_modules, .git, dist, build, coverage")

$content = $md -join "`n"
[System.IO.File]::WriteAllText($output, $content, $utf8)

Write-Host ""
Write-Host "Tree written to $output" -ForegroundColor Green
Write-Host ""
Write-Host "Preview:" -ForegroundColor Cyan
Get-Content $output | Select-Object -First 40