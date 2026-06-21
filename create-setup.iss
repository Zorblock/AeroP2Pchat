; ================================
; Aero P2P Chat Setup Script
; ================================

#define MyAppName "Aero P2P Chat"
#define MyAppVersion GetEnv("npm_package_version")
#define MyAppPublisher "Jonas Grimm"
#define MyAppURL "https://jonasgrimm.de"
#define MyAppExeName "Aero P2P Chat.exe"

[Setup]
AppId={{B7D1B27B-4654-4479-9C2D-4C90A314C2BE}
AppName={#MyAppName}
AppVerName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
AppCopyright=Copyright (c) 2026 {#MyAppPublisher}

DefaultDirName={userappdata}\jonasgrimm.de\Aero P2P Chat
UsePreviousAppDir=no
DisableDirPage=yes
DisableProgramGroupPage=yes
DirExistsWarning=no

UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Uninstallable=yes

OutputDir=dist\installer
OutputBaseFilename=Aero-P2P-Chat-Setup-{#MyAppVersion}
SetupIconFile=assets\app.ico
VersionInfoVersion={#MyAppVersion}
VersionInfoProductVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Installer
VersionInfoCopyright=Copyright (c) 2026 {#MyAppPublisher}

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern dark
SolidCompression=no
Compression=zip
InternalCompressLevel=normal

PrivilegesRequired=lowest
AppMutex=AeroP2PChatAppMutex
SetupMutex=AeroP2PChatSetupMutex
ChangesAssociations=no
DisableWelcomePage=no
DisableReadyPage=no
DisableFinishedPage=no
AlwaysShowDirOnReadyPage=no
ShowLanguageDialog=no
UsePreviousTasks=yes
CloseApplications=yes
RestartApplications=yes
CloseApplicationsFilter={#MyAppExeName}
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons"; Flags: unchecked

[Files]
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: "*.pdb,*.map,Thumbs.db,desktop.ini"

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Start {#MyAppName} now"; Flags: nowait postinstall
