; ================================
; Aero P2P Chat Setup Script
; ================================

#define MyAppName GetEnv("AERO_APP_NAME")
#define MyAppUserModelId GetEnv("AERO_APP_ID")
#define MyAppVersion GetEnv("npm_package_version")
#define MyAppPublisher GetEnv("AERO_APP_AUTHOR")
#define MyAppURL "https://zorblock.github.io/AeroP2Pchat"
#define MyAppExeName GetEnv("AERO_APP_EXE_NAME")
#define MyCliName GetEnv("AERO_CLI_COMMAND_NAME")
#define MySetupBaseName GetEnv("AERO_WINDOWS_SETUP_BASE_NAME")
#ifndef WinUnpackedDir
#define WinUnpackedDir "dist\build\win-unpacked"
#endif

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

DefaultDirName={userappdata}\zorblock\{#MyAppName}
UsePreviousAppDir=no
DisableDirPage=yes
DisableProgramGroupPage=yes
DirExistsWarning=no

UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Uninstallable=yes

OutputDir=dist\installer
OutputBaseFilename={#MySetupBaseName}-{#MyAppVersion}
SetupIconFile=assets\app.ico
VersionInfoVersion={#MyAppVersion}
VersionInfoProductVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Installer
VersionInfoCopyright=Copyright (c) 2026 {#MyAppPublisher}

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern dark
SolidCompression=yes
Compression=lzma2/normal
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
Source: "{#WinUnpackedDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: "*.pdb,*.map,Thumbs.db,desktop.ini"
Source: "dist\installer\cli\{#MyCliName}.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\installer\cli\{#MyCliName}.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; AppUserModelID: "{#MyAppUserModelId}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; AppUserModelID: "{#MyAppUserModelId}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Start {#MyAppName} now"; Flags: nowait postinstall

[UninstallDelete]
Type: files; Name: "{app}\{#MyCliName}.cmd"
Type: files; Name: "{app}\{#MyCliName}.ps1"

[Code]
function PathContains(PathValue, Entry: string): Boolean;
var
  NormalizedPath: string;
  NormalizedEntry: string;
begin
  NormalizedPath := ';' + Lowercase(PathValue) + ';';
  NormalizedEntry := ';' + Lowercase(Entry) + ';';
  Result := Pos(NormalizedEntry, NormalizedPath) > 0;
end;

procedure AddAppDirToUserPath;
var
  PathValue: string;
  AppDir: string;
begin
  AppDir := ExpandConstant('{app}');
  if not RegQueryStringValue(HKCU, 'Environment', 'Path', PathValue) then begin
    PathValue := '';
  end;

  if not PathContains(PathValue, AppDir) then begin
    if PathValue = '' then begin
      PathValue := AppDir;
    end else begin
      PathValue := PathValue + ';' + AppDir;
    end;
    RegWriteStringValue(HKCU, 'Environment', 'Path', PathValue);
  end;
end;

procedure RemoveAppDirFromUserPath;
var
  PathValue: string;
  AppDir: string;
begin
  AppDir := ExpandConstant('{app}');
  if not RegQueryStringValue(HKCU, 'Environment', 'Path', PathValue) then begin
    Exit;
  end;

  PathValue := ';' + PathValue + ';';
  StringChangeEx(PathValue, ';' + AppDir + ';', ';', True);
  while Pos(';;', PathValue) > 0 do begin
    StringChangeEx(PathValue, ';;', ';', True);
  end;
  if (Length(PathValue) > 0) and (Copy(PathValue, 1, 1) = ';') then begin
    Delete(PathValue, 1, 1);
  end;
  if (Length(PathValue) > 0) and (Copy(PathValue, Length(PathValue), 1) = ';') then begin
    Delete(PathValue, Length(PathValue), 1);
  end;

  RegWriteStringValue(HKCU, 'Environment', 'Path', PathValue);
end;

procedure CleanPreviousInstallation;
var
  UninstallerPath: string;
  iResultCode: Integer;
  AppDir: string;
  ConfigFile: string;
  TempConfigFile: string;
begin
  AppDir := ExpandConstant('{app}');
  UninstallerPath := AppDir + '\unins000.exe';
  ConfigFile := AppDir + '\config.json';
  TempConfigFile := ExpandConstant('{tmp}\config.json');

  if FileExists(ConfigFile) then begin
    CopyFile(ConfigFile, TempConfigFile, False);
  end;

  if FileExists(UninstallerPath) then begin
    Exec(UninstallerPath, '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART _?=' + AppDir, '', SW_HIDE, ewWaitUntilTerminated, iResultCode);
  end;

  if FileExists(TempConfigFile) then begin
    if not DirExists(AppDir) then begin
      CreateDir(AppDir);
    end;
    CopyFile(TempConfigFile, ConfigFile, False);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then begin
    CleanPreviousInstallation;
  end;
  if CurStep = ssPostInstall then begin
    AddAppDirToUserPath;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then begin
    RemoveAppDirFromUserPath;
  end;
end;
