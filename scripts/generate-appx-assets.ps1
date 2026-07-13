param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $Root "assets\app.png"
$outputDir = Join-Path $Root "assets\appx"

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "AppX asset source is missing: $sourcePath"
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function New-SquareAsset {
    param(
        [int]$Size,
        [string]$Name
    )

    $source = [System.Drawing.Image]::FromFile($sourcePath)
    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($source, 0, 0, $Size, $Size)
        $bitmap.Save((Join-Path $outputDir $Name), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
        $source.Dispose()
    }
}

function New-WideTile {
    $width = 310
    $height = 150
    $source = [System.Drawing.Image]::FromFile($sourcePath)
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            (New-Object System.Drawing.Rectangle 0, 0, $width, $height),
            [System.Drawing.Color]::FromArgb(255, 5, 89, 129),
            [System.Drawing.Color]::FromArgb(255, 15, 172, 190),
            0
        )
        try {
            $graphics.FillRectangle($background, 0, 0, $width, $height)
        } finally {
            $background.Dispose()
        }

        $titleFont = New-Object System.Drawing.Font("Segoe UI", 21, [System.Drawing.FontStyle]::Bold)
        $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
        try {
            $graphics.DrawString("Aero P2P", $titleFont, [System.Drawing.Brushes]::White, 16, 45)
            $graphics.DrawString("Private peer-to-peer chat", $subtitleFont, [System.Drawing.Brushes]::White, 18, 84)
        } finally {
            $titleFont.Dispose()
            $subtitleFont.Dispose()
        }
        $graphics.DrawImage($source, 174, 7, 136, 136)
        $bitmap.Save((Join-Path $outputDir "Wide310x150Logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
        $source.Dispose()
    }
}

New-SquareAsset -Size 50 -Name "StoreLogo.png"
New-SquareAsset -Size 44 -Name "Square44x44Logo.png"
New-SquareAsset -Size 150 -Name "Square150x150Logo.png"
New-WideTile

Write-Host "Generated AppX tile assets in $outputDir"
