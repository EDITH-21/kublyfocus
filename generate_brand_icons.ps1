Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\shiva\.gemini\antigravity\brain\4b156f20-51e2-4e56-b10e-355c973d2d79\.user_uploaded\media_1791095819303.png"

if (Test-Path $sourcePath) {
    $img = [System.Drawing.Image]::FromFile($sourcePath)

    function Save-ResizedImage($image, [int]$w, [int]$h, [string]$dest) {
        $bmp = New-Object System.Drawing.Bitmap $w, $h
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($image, 0, 0, $w, $h)
        $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $bmp.Dispose()
        Write-Host "Generated: $dest"
    }

    Save-ResizedImage $img 16 16 "c:\Users\shiva\Desktop\focenza\extension\assets\icons\icon-16.png"
    Save-ResizedImage $img 48 48 "c:\Users\shiva\Desktop\focenza\extension\assets\icons\icon-48.png"
    Save-ResizedImage $img 128 128 "c:\Users\shiva\Desktop\focenza\extension\assets\icons\icon-128.png"
    Save-ResizedImage $img 512 512 "c:\Users\shiva\Desktop\focenza\extension\assets\icons\logo.png"
    Save-ResizedImage $img 512 512 "c:\Users\shiva\Desktop\focenza\website\assets\logo.png"
    Save-ResizedImage $img 32 32 "c:\Users\shiva\Desktop\focenza\website\assets\favicon.png"

    $img.Dispose()
    Write-Host "All official Knolect logo assets successfully generated."
} else {
    Write-Error "Source image not found at $sourcePath"
}
