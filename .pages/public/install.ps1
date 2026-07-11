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
$InstallUrl = "https://aero.zorblock.de/install.ps1"
$FallbackInstallUrl = "https://zorblock.github.io/AeroP2Pchat/install.ps1"
$MsStoreId = "9MTXCOM7P403"

$InstallDir = "$env:APPDATA\zorblock\$AppName"
$ExePath = "$InstallDir\$AppName.exe"
$UninstallerPath = "$InstallDir\unins000.exe"

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
    # Check if installed via winget
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        $wingetOutput = winget list --id $MsStoreId --source msstore --accept-source-agreements 2>$null
        if ($wingetOutput -match "$MsStoreId") {
            return "MS Store Version"
        }
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

powershell -NoProfile -Command "try { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$InstallUrl'))) -ArgumentList '%action%' } catch { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$FallbackInstallUrl'))) -ArgumentList '%action%' }"
exit /b %ERRORLEVEL%

:menu
powershell -NoProfile -Command "try { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$InstallUrl'))) -ArgumentList 'menu' } catch { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$FallbackInstallUrl'))) -ArgumentList 'menu' }"
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
    echo Aero P2P Chat was installed via Microsoft Store. Please launch it from the Start Menu.
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

function Get-BestFormat {
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        return "msstore"
    }
    return "exe"
}

function Format-Name {
    param([string]$Format)
    if ($Format -eq "msstore") { return "Microsoft Store (Winget)" }
    if ($Format -eq "exe") { return "Standard Setup (.exe from GitHub)" }
    return $Format
}

function Install-App {
    param([string]$Format = $(Get-BestFormat))

    if ($Format -eq "msstore") {
        Write-Info "Installing from Microsoft Store using Winget..."
        try {
            winget install --id $MsStoreId --source msstore --exact --accept-package-agreements --accept-source-agreements
            Write-Ok "$AppName installed successfully via Microsoft Store!"
            Write-TerminalCommand
        } catch {
            Write-ErrorMsg "Winget installation failed."
        }
        return
    }

    Write-Info "Fetching latest release info..."
    $latest = Get-LatestVersion
    Write-Info "Latest version: $latest"

    $tempSetup = "$env:TEMP\$SetupAsset"
    Write-Info "Downloading $AppName Setup..."
    Invoke-WebRequest -Uri $SetupUrl -OutFile $tempSetup -UseBasicParsing

    Write-Info "Running installer..."
    Start-Process -FilePath $tempSetup -ArgumentList "/SILENT", "/NORESTART" -Wait

    Write-TerminalCommand
    
    Remove-Item $tempSetup -Force -ErrorAction SilentlyContinue

    Write-Ok "$AppName installed successfully!"
}

function Uninstall-App {
    $uninstalled = $false
    if (Test-Path $UninstallerPath) {
        Write-Info "Running uninstaller for .exe version..."
        Start-Process -FilePath $UninstallerPath -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART" -Wait
        $uninstalled = $true
    }
    
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        $wingetOutput = winget list --id $MsStoreId --source msstore --accept-source-agreements 2>$null
        if ($wingetOutput -match "$MsStoreId") {
            Write-Info "Uninstalling Microsoft Store version via Winget..."
            winget uninstall --id $MsStoreId --exact --accept-source-agreements
            $uninstalled = $true
        }
    }

    if ($uninstalled) {
        if (Test-Path $CliPath) {
            Remove-Item $CliPath -Force
        }
        Write-Ok "$AppName has been uninstalled."
    } else {
        Write-ErrorMsg "Aero P2P Chat is not installed."
    }
}

function Show-Status {
    $installed = Get-InstalledVersion
    Write-Info "Fetching latest release info..."
    $latest = Get-LatestVersion

    Write-Color "Installed version: $installed" "Cyan"
    Write-Color "Latest GitHub version: $latest" "Cyan"

    if ($installed -eq "MS Store Version") {
        Write-Color "Managed by Microsoft Store (Auto-Updates enabled)." "Green"
    } elseif ($installed -ne "not installed" -and $installed -ne $latest -and $latest -ne "Unknown") {
        Write-Color "An update is available on GitHub!" "Yellow"
    } elseif ($installed -eq $latest) {
        Write-Color "You are up to date." "Green"
    }
}

function Show-Menu {
    Write-Title
    
    $installed = Get-InstalledVersion
    Write-Info "Checking versions..."
    $latest = Get-LatestVersion

    $bestFormat = Get-BestFormat

    Write-Host ""
    
    if ($installed -eq "not installed") {
        Write-Color "Status: Not Installed" "Yellow"
        Write-Color "Latest: v$latest" "Cyan"
    } else {
        if ($installed -eq "MS Store Version") {
            Write-Color "Status: Installed via Microsoft Store" "Green"
        } elseif ($installed -eq $latest) {
            Write-Color "Status: Installed & Up-to-date (v$installed)" "Green"
        } else {
            Write-Color "Status: Installed (v$installed)" "Green"
            Write-Color "Latest: v$latest (Update available!)" "Yellow"
        }
    }
    Write-Host ""

    $options = @()
    
    $recName = Format-Name $bestFormat
    $options += [PSCustomObject]@{ Label = "Auto Install [Recommended: $recName]"; Action = { Install-App $bestFormat } }
    $options += [PSCustomObject]@{ Label = "Install Microsoft Store Version (Winget)"; Action = { Install-App "msstore" } }
    $options += [PSCustomObject]@{ Label = "Install Standard Setup (.exe from GitHub)"; Action = { Install-App "exe" } }
    
    if ($installed -ne "not installed") {
        $options += [PSCustomObject]@{ Label = "Uninstall $AppName"; Action = { Uninstall-App } }
    }
    
    $options += [PSCustomObject]@{ Label = "Check status details"; Action = { Show-Status } }
    $options += [PSCustomObject]@{ Label = "Exit"; Action = { exit } }

    for ($i = 0; $i -lt $options.Length; $i++) {
        $num = $i + 1
        $label = $options[$i].Label
        if ($label -match "Uninstall") {
            Write-Host "$num) " -NoNewline; Write-Color $label "Red"
        } elseif ($label -match "Exit") {
            Write-Host "$num) " -NoNewline; Write-Color $label "DarkGray"
        } else {
            Write-Host "$num) " -NoNewline; Write-Color $label "White"
        }
    }
    Write-Host ""

    $max = $options.Length
    $choice = Read-Host "Select an option [1-$max]"
    Write-Host ""

    try {
        $idx = [int]$choice - 1
        if ($idx -ge 0 -and $idx -lt $max) {
            & $options[$idx].Action
            return
        }
    } catch {}
    
    Write-Warn "Invalid choice."
    Show-Menu
}

# Main execution
switch ($Action.ToLower()) {
    "install" { Install-App }
    "update" { Install-App }
    "status" { Show-Status }
    "uninstall" { Uninstall-App }
    "remove" { Uninstall-App }
    "menu" { Show-Menu }
    default { Show-Menu }
}
