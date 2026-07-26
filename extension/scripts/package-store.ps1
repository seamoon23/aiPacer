$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$distDirectory = Join-Path $projectRoot "extension\dist"
$releaseDirectory = Join-Path $projectRoot "release\chrome-web-store"
$manifestPath = Join-Path $distDirectory "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Extension build is missing manifest.json: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$archivePath = Join-Path $releaseDirectory ("AI-Pacer-v{0}.zip" -f $manifest.version)

New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null

if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
}

Compress-Archive -Path (Join-Path $distDirectory "*") -DestinationPath $archivePath -CompressionLevel Optimal

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)

try {
    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
    if ($entryNames -notcontains "manifest.json") {
        throw "Packaged ZIP does not contain manifest.json at the archive root."
    }
}
finally {
    $archive.Dispose()
}

Write-Host "Chrome Web Store package created:"
Write-Host $archivePath
