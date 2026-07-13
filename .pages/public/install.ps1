<#
.SYNOPSIS
    Aero P2P Chat Installer
.DESCRIPTION
    This script provides an interactive menu to install, update, and manage
    Aero P2P Chat on Windows. It supports automatic format detection and leverages
    winget.exe if available, or falls back to a standalone executable.
#>

param(
    [Parameter(Position = 0)]
    [string]$Action = "menu"
)

$ErrorActionPreference = "Stop"

# Define application and repository details
$AppName            = "Aero P2P Chat"
$CliCommandName     = "aerop2p"
$Repo               = "Zorblock/AeroP2Pchat"
$ReleaseBase        = "https://github.com/$Repo/releases/latest/download"
$ManifestUrl        = "$ReleaseBase/latest.yml"
$SetupAsset         = "Aero-P2P-Chat-Windows-x64-Setup.exe"
$SetupUrl           = "$ReleaseBase/$SetupAsset"
$InstallUrl         = "https://aero.zorblock.de/install.ps1"
$FallbackInstallUrl = "https://zorblock.github.io/AeroP2Pchat/install.ps1"
$MsStoreId          = "9MTXCOM7P403"

# Installation paths
$InstallDir      = "$env:APPDATA\zorblock\$AppName"
$ExePath         = "$InstallDir\$AppName.exe"
$UninstallerPath = "$InstallDir\unins000.exe"

# CLI utility paths
$BinDir  = "$env:USERPROFILE\.local\bin"
$CliPath = "$BinDir\$CliCommandName.bat"

<#
.SYNOPSIS
    Console output helpers.
.DESCRIPTION
    These functions provide colored and structured output for the menu.
#>
function Write-Color {
    param(
        [string]$Text, 
        [ConsoleColor]$Color
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Title {
    Clear-Host
    Write-Host ""
    Write-Host "  =====================================================" -ForegroundColor Cyan
    Write-Host "       A E R O   P 2 P   C H A T" -ForegroundColor Cyan
    Write-Host "  =====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  -----------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  |" -ForegroundColor DarkGray -NoNewline
    Write-Host "            Windows Installer & Manager             " -ForegroundColor White -NoNewline
    Write-Host "|" -ForegroundColor DarkGray
    Write-Host "  -----------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Info([string]$Text) { 
    Write-Host "   [i] " -ForegroundColor Blue -NoNewline
    Write-Host $Text 
}

function Write-Ok([string]$Text) { 
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host $Text 
}

function Write-Warn([string]$Text) { 
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host $Text 
}

function Write-ErrorMsg([string]$Text) { 
    Write-Host "   [x] " -ForegroundColor Red -NoNewline
    Write-Host $Text 
}

function Wait-ForMenu {
    Write-Host ""
    [void](Read-Host "   Press Enter to return to the menu")
}

<#
.SYNOPSIS
    Retrieves the latest version tag from the GitHub releases manifest.
#>
function Get-LatestVersion {
    try {
        $invokeOptions = @{
            Uri             = $ManifestUrl
            UseBasicParsing = $true
        }
        $manifest = Invoke-RestMethod @invokeOptions
        if ($manifest -match "version:\s*(.+)") {
            return $matches[1].Trim().Trim('"')
        }
    } catch {
        Write-Warn "Could not fetch latest.yml from GitHub"
    }
    return "Unknown"
}

<#
.SYNOPSIS
    Detects if the application is currently installed and retrieves its version.
#>
function Get-InstalledVersion {
    if (Test-Path -Path $ExePath) {
        try {
            $versionInfo = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($ExePath)
            return $versionInfo.FileVersion
        } catch {}
    }

    # Check if installed via winget
    if (Get-Command "winget.exe" -ErrorAction SilentlyContinue) {
        $wingetOutput = winget.exe list --id $MsStoreId --source msstore --accept-source-agreements 2>$null
        if ($wingetOutput -match "$MsStoreId") {
            return "MS Store Version"
        }
    }

    return "not installed"
}

<#
.SYNOPSIS
    Generates and installs a global command line utility (.bat wrapper) for the app.
#>
function Write-TerminalCommand {
    if (-not (Test-Path -Path $BinDir)) {
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

powershell.exe -NoProfile -Command "try { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$InstallUrl'))) -ArgumentList '%action%' } catch { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$FallbackInstallUrl'))) -ArgumentList '%action%' }"
exit /b %ERRORLEVEL%

:menu
powershell.exe -NoProfile -Command "try { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$InstallUrl'))) -ArgumentList 'menu' } catch { Invoke-Command -ScriptBlock ([Scriptblock]::Create((Invoke-RestMethod '$FallbackInstallUrl'))) -ArgumentList 'menu' }"
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
        if (-not $newPath.EndsWith(";")) { 
            $newPath += ";" 
        }
        $newPath += $BinDir
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Ok "Added $BinDir to User PATH. You may need to restart your terminal."
    }
}

<#
.SYNOPSIS
    Determines the best available installation method (Winget vs EXE).
#>
function Get-BestFormat {
    if (Get-Command "winget.exe" -ErrorAction SilentlyContinue) {
        return "msstore"
    }
    return "exe"
}

function Format-Name {
    param([string]$Format)
    if ($Format -eq "msstore") { return "Microsoft Store (Winget)" }
    if ($Format -eq "exe")     { return "Standard Setup (.exe from GitHub)" }
    return $Format
}

<#
.SYNOPSIS
    Handles the installation of the application via the specified format.
#>
function Install-App {
    param(
        [string]$Format = $(Get-BestFormat)
    )

    if ($Format -eq "msstore") {
        Write-Info "Installing from Microsoft Store using winget.exe..."
        try {
            winget.exe install --id $MsStoreId --source msstore --exact --accept-package-agreements --accept-source-agreements
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
    
    $downloadOptions = @{
        Uri             = $SetupUrl
        OutFile         = $tempSetup
        UseBasicParsing = $true
    }
    Invoke-WebRequest @downloadOptions

    Write-Info "Running installer..."
    
    $processOptions = @{
        FilePath     = $tempSetup
        ArgumentList = @("/SILENT", "/NORESTART")
        Wait         = $true
    }
    Start-Process @processOptions

    Write-TerminalCommand
    
    Remove-Item -Path $tempSetup -Force -ErrorAction SilentlyContinue

    Write-Ok "$AppName installed successfully!"
}

<#
.SYNOPSIS
    Uninstalls the application, handling both EXE and Store installations.
#>
function Uninstall-App {
    $uninstalled = $false

    if (Test-Path -Path $UninstallerPath) {
        Write-Info "Running uninstaller for .exe version..."
        
        $uninstallOptions = @{
            FilePath     = $UninstallerPath
            ArgumentList = @("/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART")
            Wait         = $true
        }
        Start-Process @uninstallOptions
        
        $uninstalled = $true
    }
    
    if (Get-Command "winget.exe" -ErrorAction SilentlyContinue) {
        $wingetOutput = winget.exe list --id $MsStoreId --source msstore --accept-source-agreements 2>$null
        if ($wingetOutput -match "$MsStoreId") {
            Write-Info "Uninstalling Microsoft Store version via winget.exe..."
            winget.exe uninstall --id $MsStoreId --exact --accept-source-agreements
            $uninstalled = $true
        }
    }

    if ($uninstalled) {
        if (Test-Path -Path $CliPath) {
            Remove-Item -Path $CliPath -Force
        }
        Write-Ok "$AppName has been uninstalled."
    } else {
        Write-ErrorMsg "Aero P2P Chat is not installed."
    }
}

<#
.SYNOPSIS
    Displays current installation status.
#>
function Show-Status {
    $installed = Get-InstalledVersion
    Write-Info "Fetching latest release info..."
    $latest = Get-LatestVersion

    Write-Host ""
    Write-Host "   Installed version: " -NoNewline; Write-Color $installed "Cyan"
    Write-Host "   Latest GitHub:     " -NoNewline; Write-Color $latest "Cyan"
    Write-Host ""

    if ($installed -eq "MS Store Version") {
        Write-Color "   [OK] Managed by Microsoft Store (Auto-Updates enabled)." "Green"
    } elseif ($installed -ne "not installed" -and $installed -ne $latest -and $latest -ne "Unknown") {
        Write-Color "   [!] An update is available on GitHub!" "Yellow"
    } elseif ($installed -eq $latest) {
        Write-Color "   [OK] You are up to date." "Green"
    }
    Write-Host ""
}

<#
.SYNOPSIS
    Displays the interactive CLI menu for the user.
#>
function Show-TerminalMenu {
    while ($true) {
    Write-Title
    
    $installed = Get-InstalledVersion
    Write-Info "Checking versions..."
    $latest = Get-LatestVersion
    $bestFormat = Get-BestFormat

    Write-Host ""
    
    # Status Banner
    if ($installed -eq "not installed") {
        Write-Host "   Status: " -NoNewline; Write-Color "Not Installed" "Yellow"
        Write-Host "   Latest: " -NoNewline; Write-Color "v$latest" "Cyan"
    } else {
        if ($installed -eq "MS Store Version") {
            Write-Host "   Status: " -NoNewline; Write-Color "Installed via Microsoft Store" "Green"
        } elseif ($installed -eq $latest) {
            Write-Host "   Status: " -NoNewline; Write-Color "Installed & Up-to-date (v$installed)" "Green"
        } else {
            Write-Host "   Status: " -NoNewline; Write-Color "Installed (v$installed)" "Green"
            Write-Host "   Latest: " -NoNewline; Write-Color "v$latest (Update available!)" "Yellow"
        }
    }
    Write-Host "`n"

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
            Write-Host "   $num) " -NoNewline; Write-Color $label "Red"
        } elseif ($label -match "Exit") {
            Write-Host "   $num) " -NoNewline; Write-Color $label "DarkGray"
        } else {
            Write-Host "   $num) " -NoNewline; Write-Color $label "White"
        }
    }
    Write-Host ""

    $max = $options.Length
    $choice = Read-Host "   Select an option [1-$max]"
    Write-Host ""

    try {
        $idx = [int]$choice - 1
        if ($idx -ge 0 -and $idx -lt $max) {
            try {
                & $options[$idx].Action
            } catch {
                Write-ErrorMsg "The selected action could not be completed: $($_.Exception.Message)"
            }
            Wait-ForMenu
            continue
        }
    } catch {}
    
    Write-Warn "Invalid choice."
    Wait-ForMenu
    }
}

function Test-GuiAvailable {
    if (-not [Environment]::UserInteractive) { return $false }
    if ([System.Threading.Thread]::CurrentThread.ApartmentState -ne "STA") { return $false }
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        Add-Type -AssemblyName System.Drawing -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Show-GuiActivity {
    param([string]$Message)

    $activity = New-Object System.Windows.Forms.Form
    $activity.Text = "$AppName Installer"
    $activity.ClientSize = New-Object System.Drawing.Size(430, 150)
    $activity.StartPosition = "CenterScreen"
    $activity.FormBorderStyle = "FixedDialog"
    $activity.ControlBox = $false
    $activity.BackColor = [System.Drawing.Color]::White

    $title = New-Object System.Windows.Forms.Label
    $title.Text = "Working on it..."
    $title.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 15, [System.Drawing.FontStyle]::Bold)
    $title.AutoSize = $true
    $title.Location = New-Object System.Drawing.Point(24, 22)
    $activity.Controls.Add($title)

    $detail = New-Object System.Windows.Forms.Label
    $detail.Text = "$Message`r`nYou can follow the detailed output in the terminal."
    $detail.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#475569")
    $detail.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $detail.AutoSize = $true
    $detail.Location = New-Object System.Drawing.Point(27, 55)
    $activity.Controls.Add($detail)

    $progress = New-Object System.Windows.Forms.ProgressBar
    $progress.Style = "Marquee"
    $progress.MarqueeAnimationSpeed = 32
    $progress.Location = New-Object System.Drawing.Point(27, 111)
    $progress.Size = New-Object System.Drawing.Size(375, 12)
    $activity.Controls.Add($progress)

    $activity.Show()
    [System.Windows.Forms.Application]::DoEvents()
    return $activity
}

function Invoke-GuiAction {
    param(
        [string]$Message,
        [scriptblock]$Operation
    )

    $activity = Show-GuiActivity $Message
    try {
        & $Operation
        $activity.Close()
        $activity.Dispose()
        [System.Windows.Forms.MessageBox]::Show("Completed successfully. Review the terminal for details.", $AppName) | Out-Null
    } catch {
        $activity.Close()
        $activity.Dispose()
        [System.Windows.Forms.MessageBox]::Show("The action failed: $($_.Exception.Message)`r`n`r`nReview the terminal for details.", $AppName, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
}

function Show-GuiMenu {
    while ($true) {
        $installed = Get-InstalledVersion
        $latest = Get-LatestVersion
        $bestFormat = Get-BestFormat

        $form = New-Object System.Windows.Forms.Form
        $form.Text = "$AppName Installer"
        $form.ClientSize = New-Object System.Drawing.Size(640, 600)
        $form.StartPosition = "CenterScreen"
        $form.FormBorderStyle = "FixedSingle"
        $form.MaximizeBox = $false
        $form.MinimizeBox = $false
        $form.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#F5F7FB")
        $form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

        $header = New-Object System.Windows.Forms.Panel
        $header.Location = New-Object System.Drawing.Point(0, 0)
        $header.Size = New-Object System.Drawing.Size(640, 122)
        $header.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#0F172A")
        $form.Controls.Add($header)

        $heading = New-Object System.Windows.Forms.Label
        $heading.Text = $AppName
        $heading.ForeColor = [System.Drawing.Color]::White
        $heading.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 22, [System.Drawing.FontStyle]::Bold)
        $heading.AutoSize = $true
        $heading.Location = New-Object System.Drawing.Point(30, 23)
        $header.Controls.Add($heading)

        $subheading = New-Object System.Windows.Forms.Label
        $subheading.Text = "Install, update, and manage your desktop app"
        $subheading.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#CBD5E1")
        $subheading.Font = New-Object System.Drawing.Font("Segoe UI", 10)
        $subheading.AutoSize = $true
        $subheading.Location = New-Object System.Drawing.Point(33, 72)
        $header.Controls.Add($subheading)

        $statusCard = New-Object System.Windows.Forms.Panel
        $statusCard.Location = New-Object System.Drawing.Point(30, 146)
        $statusCard.Size = New-Object System.Drawing.Size(580, 86)
        $statusCard.BackColor = [System.Drawing.Color]::White
        $statusCard.BorderStyle = "FixedSingle"
        $form.Controls.Add($statusCard)

        $statusTitle = New-Object System.Windows.Forms.Label
        $statusTitle.Text = "CURRENT INSTALLATION"
        $statusTitle.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#64748B")
        $statusTitle.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
        $statusTitle.AutoSize = $true
        $statusTitle.Location = New-Object System.Drawing.Point(16, 13)
        $statusCard.Controls.Add($statusTitle)

        $statusText = New-Object System.Windows.Forms.Label
        $statusText.Text = "Installed  $installed`r`nLatest      $latest"
        $statusText.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#0F172A")
        $statusText.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 10)
        $statusText.AutoSize = $true
        $statusText.Location = New-Object System.Drawing.Point(16, 34)
        $statusCard.Controls.Add($statusText)

        $recommendation = New-Object System.Windows.Forms.Label
        $recommendation.Text = "Recommended: $(Format-Name $bestFormat)"
        $recommendation.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#0284C7")
        $recommendation.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
        $recommendation.AutoSize = $true
        $recommendation.Location = New-Object System.Drawing.Point(330, 39)
        $statusCard.Controls.Add($recommendation)

        $actions = @(
            @{ Key = "auto"; Text = "Install automatically"; Style = "primary" },
            @{ Key = "msstore"; Text = "Microsoft Store"; Style = "secondary" },
            @{ Key = "exe"; Text = "Standalone setup (.exe)"; Style = "secondary" },
            @{ Key = "status"; Text = "Check status"; Style = "secondary" },
            @{ Key = "uninstall"; Text = "Uninstall"; Style = "danger" },
            @{ Key = "exit"; Text = "Close"; Style = "ghost" }
        )

        $top = 258
        foreach ($actionItem in $actions) {
            $button = New-Object System.Windows.Forms.Button
            $button.Text = $actionItem.Text
            $button.Tag = $actionItem.Key
            $button.Size = New-Object System.Drawing.Size(580, 43)
            $button.Location = New-Object System.Drawing.Point(30, $top)
            $button.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 10)
            $button.FlatStyle = "Flat"
            $button.Cursor = [System.Windows.Forms.Cursors]::Hand
            $button.FlatAppearance.BorderSize = 0
            switch ($actionItem.Style) {
                "primary" {
                    $button.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#0284C7")
                    $button.ForeColor = [System.Drawing.Color]::White
                }
                "danger" {
                    $button.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#FFF1F2")
                    $button.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#BE123C")
                }
                "ghost" {
                    $button.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#E2E8F0")
                    $button.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#334155")
                }
                default {
                    $button.BackColor = [System.Drawing.Color]::White
                    $button.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#1E293B")
                    $button.FlatAppearance.BorderSize = 1
                    $button.FlatAppearance.BorderColor = [System.Drawing.ColorTranslator]::FromHtml("#CBD5E1")
                }
            }
            $button.Add_Click({
                param($clickedControl, $clickData)
                $clickedControl.FindForm().Tag = $clickedControl.Tag
                $clickedControl.FindForm().Close()
            })
            $form.Controls.Add($button)
            $top += 49
        }

        $form.ShowDialog() | Out-Null
        $choice = [string]$form.Tag
        $form.Dispose()

        switch ($choice) {
            "auto" { Invoke-GuiAction "Installing with $(Format-Name $bestFormat)" { Install-App $bestFormat } }
            "msstore" { Invoke-GuiAction "Opening Microsoft Store installation" { Install-App "msstore" } }
            "exe" { Invoke-GuiAction "Downloading and installing the standalone setup" { Install-App "exe" } }
            "status" { [System.Windows.Forms.MessageBox]::Show("Installed: $installed`r`nLatest: $latest", "$AppName Status") | Out-Null }
            "uninstall" {
                $confirm = [System.Windows.Forms.MessageBox]::Show(
                    "Uninstall $AppName? Your app data is kept.",
                    $AppName,
                    [System.Windows.Forms.MessageBoxButtons]::YesNo,
                    [System.Windows.Forms.MessageBoxIcon]::Warning
                )
                if ($confirm -eq [System.Windows.Forms.DialogResult]::Yes) {
                    Invoke-GuiAction "Removing $AppName" { Uninstall-App }
                }
            }
            default { return }
        }
    }
}

function Show-Menu {
    Show-TerminalMenu
}

# Main execution loop
switch ($Action.ToLower()) {
    "install"   { Install-App }
    "update"    { Install-App }
    "status"    { Show-Status }
    "uninstall" { Uninstall-App }
    "remove"    { Uninstall-App }
    "menu"      { Show-Menu }
    default     { Show-Menu }
}
