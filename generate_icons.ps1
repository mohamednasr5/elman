Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\NUMBER 1\.gemini\antigravity\brain\f1563e4c-816e-4991-8c21-b13d1cae38d8\.user_uploaded\media_1788470281294.png"
$destDir = "C:\Users\NUMBER 1\.gemini\antigravity\scratch\elmanzala"

$original = [System.Drawing.Image]::FromFile($srcPath)
Write-Output "Original dimensions: $($original.Width)x$($original.Height)"

$sizes = @(16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512)

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $graphics.DrawImage($original, 0, 0, $s, $s)
    $graphics.Dispose()

    $outPath = Join-Path $destDir "icons\icon-${s}x${s}.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    if ($s -eq 16) {
        $bmp.Save((Join-Path $destDir "favicon-16x16.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    }
    if ($s -eq 32) {
        $bmp.Save((Join-Path $destDir "favicon-32x32.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Save((Join-Path $destDir "favicon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    }
    if ($s -eq 48) {
        $bmp.Save((Join-Path $destDir "favicon-48x48.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    }
    if ($s -eq 192) {
        $bmp.Save((Join-Path $destDir "apple-touch-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    }

    $bmp.Dispose()
    Write-Output "Generated icon-${s}x${s}.png"
}

# Generate favicon.ico from 32x32 or 48x48
$bmp48 = New-Object System.Drawing.Bitmap $original, 48, 48
$iconHandle = $bmp48.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::Create((Join-Path $destDir "favicon.ico"))
$icon.Save($stream)
$stream.Close()
$bmp48.Dispose()

$original.Dispose()
Write-Output "Successfully updated all PWA & Favicon icons!"
