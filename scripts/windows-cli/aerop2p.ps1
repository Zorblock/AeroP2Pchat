param([string]$Command = "help")

$ErrorActionPreference = "Stop"
$AppName = "__APP_NAME__"
$CurrentVersion = "__APP_VERSION__"
$AppExe = Join-Path $PSScriptRoot "__APP_EXE_NAME__"
$Uninstaller = Join-Path $PSScriptRoot "unins000.exe"
$Repo = "__REPO__"
$WindowsInstallerAsset = "__WINDOWS_INSTALLER_ASSET__"
$ManifestUrl = "https://github.com/$Repo/releases/latest/download/latest.yml"

function Read-ManifestValue([string]$Text, [string]$Key) {
  $match = [regex]::Match($Text, "(?m)^" + [regex]::Escape($Key) + ":\s*""?([^""`r`n]+)""?")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }
  return ""
}

function Convert-ResponseContentToText($Content) {
  if ($Content -is [byte[]]) {
    return [System.Text.Encoding]::UTF8.GetString($Content)
  }
  return [string]$Content
}

function Get-LatestManifest {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $ManifestUrl
  Convert-ResponseContentToText $response.Content
}

function Start-App {
  if (-not (Test-Path $AppExe)) {
    throw "$AppName executable not found."
  }
  Start-Process -FilePath $AppExe -ArgumentList "--disable-logging" -WorkingDirectory $PSScriptRoot | Out-Null
}

function Show-Status {
  Write-Host "$AppName"
  Write-Host "Installed: $CurrentVersion"
  try {
    $manifest = Get-LatestManifest
    $latest = Read-ManifestValue $manifest "version"
    if (-not $latest) {
      Write-Host "Latest:    unknown"
      Write-Host "Could not read latest version."
      return
    }
    Write-Host "Latest:    $latest"
    if ($latest -and $latest -ne $CurrentVersion) {
      Write-Host "Update available. Run: __CLI_COMMAND_NAME__ update"
    }
    else {
      Write-Host "Up to date."
    }
  }
  catch {
    Write-Host "Latest:    unknown"
    Write-Host $_.Exception.Message
  }
}

function Install-Update {
  $manifest = Get-LatestManifest
  $latest = Read-ManifestValue $manifest "version"
  if (-not $latest) {
    throw "Could not read latest version."
  }
  if ($latest -eq $CurrentVersion) {
    Write-Host "Already up to date."
    return
  }

  $url = Read-ManifestValue $manifest "windowsUrl"
  if (-not $url) {
    $url = Read-ManifestValue $manifest "url"
  }
  $sha256 = Read-ManifestValue $manifest "windowsSha256"
  if (-not $sha256) {
    $sha256 = Read-ManifestValue $manifest "sha256"
  }
  if (-not $url) {
    throw "Manifest has no Windows installer URL."
  }

  $target = Join-Path $env:TEMP $WindowsInstallerAsset
  Write-Host "Downloading $latest..."
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $target
  if ($sha256) {
    $actual = (Get-FileHash -Algorithm SHA256 $target).Hash.ToLowerInvariant()
    if ($actual -ne $sha256.ToLowerInvariant()) {
      throw "Installer SHA256 mismatch."
    }
  }

  Write-Host "Starting setup..."
  Start-Process -FilePath $target -ArgumentList "/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/FORCECLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS"
}

switch ($Command.ToLowerInvariant()) {
  "open" { Start-App; break }
  "run" { Start-App; break }
  "start" { Start-App; break }
  "status" { Show-Status; break }
  "update" { Install-Update; break }
  "install" { Install-Update; break }
  "uninstall" {
    if (Test-Path $Uninstaller) {
      Start-Process -FilePath $Uninstaller
    }
    else {
      throw "Uninstaller not found."
    }
    break
  }
  "remove" {
    if (Test-Path $Uninstaller) {
      Start-Process -FilePath $Uninstaller
    }
    else {
      throw "Uninstaller not found."
    }
    break
  }
  default {
    Write-Host "Usage:"
    Write-Host "  __CLI_COMMAND_NAME__ update     Update $AppName"
    Write-Host "  __CLI_COMMAND_NAME__ status     Show installed and latest version"
    Write-Host "  __CLI_COMMAND_NAME__ open       Start $AppName"
    Write-Host "  __CLI_COMMAND_NAME__ uninstall  Remove $AppName"
    exit 1
  }
}
