param(
    [string]$IconSource = "$PSScriptRoot/../store_assets/app-icon-2027.png",
    [string]$FeatureSource = "$PSScriptRoot/../store_assets/feature-graphic-2027.png"
)

Add-Type -AssemblyName System.Drawing

function Write-CoverPng {
    param(
        [Parameter(Mandatory)] [string]$Source,
        [Parameter(Mandatory)] [string]$Destination,
        [Parameter(Mandatory)] [int]$Width,
        [Parameter(Mandatory)] [int]$Height
    )

    $sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source))
    try {
        $sourceRatio = $sourceImage.Width / $sourceImage.Height
        $targetRatio = $Width / $Height
        if ($sourceRatio -gt $targetRatio) {
            $cropHeight = $sourceImage.Height
            $cropWidth = [int][Math]::Round($cropHeight * $targetRatio)
            $cropX = [int](($sourceImage.Width - $cropWidth) / 2)
            $cropY = 0
        } else {
            $cropWidth = $sourceImage.Width
            $cropHeight = [int][Math]::Round($cropWidth / $targetRatio)
            $cropX = 0
            $cropY = [int](($sourceImage.Height - $cropHeight) / 2)
        }

        $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
        try {
            $bitmap.SetResolution(144, 144)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $destinationRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
                $sourceRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)
                $graphics.DrawImage($sourceImage, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
            } finally {
                $graphics.Dispose()
            }

            $destinationDirectory = Split-Path -Parent $Destination
            if ($destinationDirectory) {
                New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
            }
            $bitmap.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $bitmap.Dispose()
        }
    } finally {
        $sourceImage.Dispose()
    }
}

$resourceRoot = Join-Path $PSScriptRoot '../android/app/src/main/res'
$densities = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

foreach ($entry in $densities.GetEnumerator()) {
    foreach ($name in @('ic_launcher.png', 'ic_launcher_round.png')) {
        Write-CoverPng -Source $IconSource -Destination (Join-Path $resourceRoot "$($entry.Key)/$name") -Width $entry.Value -Height $entry.Value
    }
}

Write-CoverPng -Source $IconSource -Destination (Join-Path $PSScriptRoot '../store_assets/play-store-icon-2027.png') -Width 512 -Height 512
Write-CoverPng -Source $FeatureSource -Destination (Join-Path $PSScriptRoot '../store_assets/feature-graphic-2027-final.png') -Width 1024 -Height 500

Write-Host 'Android launcher and Play Store artwork generated.'
