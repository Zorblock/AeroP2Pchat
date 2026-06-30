@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0__CLI_COMMAND_NAME__.ps1" %*
exit /b %ERRORLEVEL%
