# Generates resources/splash.bmp for the electron-builder portable unpack splash.
# NSIS newadvsplash requires a 24-bit BMP.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$out = Join-Path (Split-Path $PSScriptRoot -Parent) "resources\splash.bmp"

$w = 520
$h = 280
$src = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($src)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

$accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0, 121, 252))
$g.FillRectangle($accent, 0, 0, $w, 6)

$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center

$titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
$subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(71, 85, 105))

$g.DrawString("BionApp", $titleFont, $titleBrush, (New-Object System.Drawing.RectangleF 0, 82, $w, 40), $format)
$g.DrawString("Iniciando.", $subFont, $subBrush, (New-Object System.Drawing.RectangleF 0, 132, $w, 24), $format)
$g.DrawString("Espere unos segundos...", $subFont, $subBrush, (New-Object System.Drawing.RectangleF 0, 158, $w, 24), $format)

$bmp24 = $src.Clone((New-Object System.Drawing.Rectangle 0, 0, $w, $h), [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$bmp24.Save($out, [System.Drawing.Imaging.ImageFormat]::Bmp)

$g.Dispose()
$src.Dispose()
$bmp24.Dispose()
$titleFont.Dispose()
$subFont.Dispose()
$accent.Dispose()
$titleBrush.Dispose()
$subBrush.Dispose()
Write-Host "Wrote $out"
