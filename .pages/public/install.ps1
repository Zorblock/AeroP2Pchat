param(
    [string]$Action = "menu"
)

$ErrorActionPreference = "Stop"

$AppName = "Aero P2P Chat"
$AppSlug = "aero-p2p-chat"
$CliCommandName = "aerop2p"
$Repo = "Zorblock/AeroP2Pchat"
$ReleaseBase = "https://github.com/$Repo/releases/latest/download"
$ManifestUrl = "$ReleaseBase/latest.yml"
$SetupAsset = "Aero-P2P-Chat-Windows-x64-Setup.exe"
$SetupUrl = "$ReleaseBase/$SetupAsset"
$InstallUrl = "https://zorblock.github.io/AeroP2Pchat/install.ps1"

$InstallDir = "$env:LOCALAPPDATA\Programs\$AppSlug"
$ExePath = "$InstallDir\$AppName.exe"
$UninstallerPath = "$InstallDir\Uninstall $AppName.exe"

$BinDir = "$env:USERPROFILE\.local\bin"
$CliPath = "$BinDir\$CliCommandName.bat"

function Write-Color {
    param([string]$Text, [ConsoleColor]$Color)
    Write-Host $Text -ForegroundColor $Color
}

function Write-Title {
    Write-Color "----------------------------------------" "DarkGray"
    Write-Color "$AppName Windows Installer" "White"
    Write-Color "----------------------------------------" "DarkGray"
}

function Write-Info([string]$Text) { Write-Host "> " -ForegroundColor Blue -NoNewline; Write-Host $Text }
function Write-Ok([string]$Text) { Write-Host "OK " -ForegroundColor Green -NoNewline; Write-Host $Text }
function Write-Warn([string]$Text) { Write-Host "WARN " -ForegroundColor Yellow -NoNewline; Write-Host $Text }
function Write-ErrorMsg([string]$Text) { Write-Host "ERROR " -ForegroundColor Red -NoNewline; Write-Host $Text }

function Get-LatestVersion {
    try {
        $manifest = Invoke-RestMethod -Uri $ManifestUrl -UseBasicParsing
        if ($manifest -match "version:\s*(.+)") {
            return $matches[1].Trim()
        }
    } catch {
        Write-Warn "Could not fetch latest.yml"
    }
    return "Unknown"
}

function Get-InstalledVersion {
    if (Test-Path $ExePath) {
        try {
            $versionInfo = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($ExePath)
            return $versionInfo.FileVersion
        } catch {}
    }
    return "not installed"
}

function Write-TerminalCommand {
    if (!(Test-Path $BinDir)) {
        New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
    }

    $batContent = @"
@echo off
setlocal
set "action=%~1"

if "%action%"=="open" goto runapp
if "%action%"=="run" goto runapp
if "%action%"=="start" goto runapp
if "%action%"=="" goto menu

if "%action%"=="help" goto help
if "%action%"=="--help" goto help
if "%action%"=="-h" goto help

powershell -NoProfile -Command "Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$InstallUrl'))) -ArgumentList '%action%'"
exit /b %ERRORLEVEL%

:menu
powershell -NoProfile -Command "Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$InstallUrl'))) -ArgumentList 'menu'"
exit /b %ERRORLEVEL%

:help
echo $AppName
echo.
echo Usage:
echo   $CliCommandName ^<command^>
echo.
echo Commands:
echo   open        Start $AppName
echo   status      Show installed and latest version
echo   update      Install the latest release
echo   uninstall   Remove $AppName
echo   menu        Open the installer menu
echo   help        Show this help
exit /b 0

:runapp
if exist "$ExePath" (
    start "" "$ExePath" %*
) else (
    echo $AppName is not installed.
    exit /b 1
)
"@
    Set-Content -Path $CliPath -Value $batContent -Encoding UTF8

    # Add BinDir to user PATH if not present
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($userPath -notmatch [regex]::Escape($BinDir)) {
        $newPath = $userPath
        if (!$newPath.EndsWith(";")) { $newPath += ";" }
        $newPath += $BinDir
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Ok "Added $BinDir to User PATH. You may need to restart your terminal."
    }
}

function Install-App {
    param([bool]$IsUpdate = $false)

    Write-Info "Fetching latest release info..."
    $latest = Get-LatestVersion
    Write-Info "Latest version: $latest"

    $tempSetup = "$env:TEMP\$SetupAsset"
    Write-Info "Downloading $AppName Setup..."
    Invoke-WebRequest -Uri $SetupUrl -OutFile $tempSetup -UseBasicParsing

    Write-Info "Running installer..."
    if ($IsUpdate) {
        Start-Process -FilePath $tempSetup -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART" -Wait
    } else {
        Start-Process -FilePath $tempSetup -ArgumentList "/SILENT", "/NORESTART" -Wait
    }

    Write-TerminalCommand
    
    Remove-Item $tempSetup -Force -ErrorAction SilentlyContinue

    Write-Ok "$AppName installed successfully!"
}

function Uninstall-App {
    if (Test-Path $UninstallerPath) {
        Write-Info "Running uninstaller..."
        Start-Process -FilePath $UninstallerPath -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART" -Wait
        
        # Cleanup CLI
        if (Test-Path $CliPath) {
            Remove-Item $CliPath -Force
        }
        
        Write-Ok "$AppName has been uninstalled."
    } else {
        Write-ErrorMsg "Uninstaller not found. Is it installed?"
    }
}

function Show-Status {
    $installed = Get-InstalledVersion
    Write-Info "Fetching latest release info..."
    $latest = Get-LatestVersion

    Write-Color "Installed version: $installed" "Cyan"
    Write-Color "Latest version:    $latest" "Cyan"

    if ($installed -ne "not installed" -and $installed -ne $latest -and $latest -ne "Unknown") {
        Write-Color "An update is available!" "Yellow"
    } elseif ($installed -eq $latest) {
        Write-Color "You are up to date." "Green"
    }
}

function Show-Menu {
    Write-Title
    $installed = Get-InstalledVersion

    if ($installed -eq "not installed") {
        Write-Color "Status: Not Installed" "Yellow"
    } else {
        Write-Color "Status: Installed (v$installed)" "Green"
    }
    Write-Host ""

    Write-Host "1) " -NoNewline; Write-Color "Install $AppName" "White"
    Write-Host "2) " -NoNewline; Write-Color "Update to latest version" "White"
    Write-Host "3) " -NoNewline; Write-Color "Check status" "White"
    Write-Host "4) " -NoNewline; Write-Color "Uninstall" "Red"
    Write-Host "5) " -NoNewline; Write-Color "Exit" "DarkGray"
    Write-Host ""

    $choice = Read-Host "Select an option [1-5]"
    Write-Host ""

    switch ($choice) {
        "1" { Install-App }
        "2" { Install-App -IsUpdate $true }
        "3" { Show-Status }
        "4" { Uninstall-App }
        "5" { exit }
        default { Write-Warn "Invalid choice."; Show-Menu }
    }
}

# Main execution
switch ($Action.ToLower()) {
    "install" { Install-App }
    "update" { Install-App -IsUpdate $true }
    "status" { Show-Status }
    "uninstall" { Uninstall-App }
    "remove" { Uninstall-App }
    "menu" { Show-Menu }
    default { Show-Menu }
}
