# Fetch yt-dlp + spotDL Windows sidecars into bin/ for Tauri externalBin.
# Usage (from repo root):  powershell -File scripts/fetch-download-sidecars.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Bin = Join-Path $Root "bin"
$Triple = "x86_64-pc-windows-msvc"

New-Item -ItemType Directory -Force -Path $Bin | Out-Null

function Get-GitHubAssetUrl([string]$Repo, [string]$AssetPattern) {
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers @{
    "User-Agent" = "Automated-Mp3-Gui-sidecar-fetch"
  }
  $asset = $release.assets | Where-Object { $_.name -match $AssetPattern } | Select-Object -First 1
  if (-not $asset) {
    throw "No asset matching /$AssetPattern/ in $Repo latest release"
  }
  return $asset.browser_download_url
}

function Save-Sidecar([string]$Url, [string]$Name) {
  $dest = Join-Path $Bin "$Name-$Triple.exe"
  Write-Host "Downloading $Name -> $dest"
  Invoke-WebRequest -Uri $Url -OutFile $dest
  # Convenience copy without triple (optional local use)
  Copy-Item $dest (Join-Path $Bin "$Name.exe") -Force
  Write-Host "  OK ($((Get-Item $dest).Length) bytes)"
}

# yt-dlp ships a single Windows exe on releases
$ytdlpUrl = Get-GitHubAssetUrl "yt-dlp/yt-dlp" "^yt-dlp\.exe$"
Save-Sidecar $ytdlpUrl "yt-dlp"

# spotDL: prefer standalone Windows exe if published; else .exe asset
try {
  $spotUrl = Get-GitHubAssetUrl "spotDL/spotify-downloader" "spotdl.*\.exe$"
} catch {
  Write-Warning "spotDL .exe asset not found on latest release; trying alternate name"
  $spotUrl = Get-GitHubAssetUrl "spotDL/spotify-downloader" "\.exe$"
}
Save-Sidecar $spotUrl "spotdl"

Write-Host ""
Write-Host "Done. Tauri externalBin expects:"
Write-Host "  bin/yt-dlp-$Triple.exe"
Write-Host "  bin/spotdl-$Triple.exe"
Write-Host "ffmpeg must be on PATH (not bundled)."
