# ╔══════════════════════════════════════════════════════╗
# ║  Auto Cache-Buster — يحدّث كل ?v= بـ git commit hash ║
# ║  شغّله قبل كل push: .\bump-version.ps1              ║
# ╚══════════════════════════════════════════════════════╝

$hash = git rev-parse --short=8 HEAD 2>$null
if (-not $hash) { Write-Host "❌ مش في git repository!"; exit 1 }

Write-Host "🔄 جاري تحديث جميع الـ versions لـ: $hash" -ForegroundColor Cyan

$files = Get-ChildItem -Recurse -Include "*.html","*.js" -File |
    Where-Object { $_.FullName -notlike "*\.git*" -and $_.FullName -notlike "*node_modules*" }

$updated = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace '\?v=[a-zA-Z0-9.\-]+', "?v=$hash"
    if ($newContent -ne $content) {
        Set-Content $file.FullName $newContent -NoNewline -Encoding UTF8
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        $updated++
    }
}

Write-Host ""
Write-Host "✅ تم تحديث $updated ملف بالـ version: $hash" -ForegroundColor Green
Write-Host ""
Write-Host "📦 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "   git add -A"
Write-Host "   git commit -m `"chore: cache bust v=$hash`""
Write-Host "   git checkout -b deploy/$hash"
Write-Host "   git push origin deploy/$hash"
