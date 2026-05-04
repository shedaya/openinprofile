@echo off
setlocal EnableDelayedExpansion

echo.
echo  =====================================================
echo    Open in Profile -- Companion App Installer
echo  =====================================================
echo.
echo  This installs the small helper that lets Chrome
echo  open links in a different profile.
echo.
echo  You'll need your Extension ID from Chrome.
echo  (The welcome page inside the extension shows it.)
echo.

set /p EXT_ID="  Paste Extension ID and press Enter: "

if "!EXT_ID!"=="" (
    echo.
    echo  ERROR: No Extension ID entered.
    pause & exit /b 1
)

:: Validate rough format (32 lowercase letters)
echo !EXT_ID! | findstr /r "^[a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z][a-z]$" >nul
if errorlevel 1 (
    echo.
    echo  WARNING: That doesn't look like a valid Extension ID.
    echo  It should be 32 lowercase letters, e.g.:
    echo    abcdefghijklmnopabcdefghijklmnop
    echo.
    set /p CONT="  Continue anyway? (y/n): "
    if /i "!CONT!" neq "y" exit /b 1
)

set INSTALL_DIR=%~dp0
if "!INSTALL_DIR:~-1!"=="\" set INSTALL_DIR=!INSTALL_DIR:~0,-1!

set LAUNCHER=!INSTALL_DIR!\host_launcher.bat
set MANIFEST=!INSTALL_DIR!\com.openinprofile.host.json

echo.
echo  Writing manifest...

(
echo {
echo   "name": "com.openinprofile.host",
echo   "description": "Open in Profile native messaging host",
echo   "path": "!LAUNCHER:\=\\!",
echo   "type": "stdio",
echo   "allowed_origins": [
echo     "chrome-extension://!EXT_ID!/"
echo   ]
echo }
) > "!MANIFEST!"

echo  Registering with Chrome...

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.openinprofile.host" ^
    /ve /t REG_SZ /d "!MANIFEST!" /f >nul 2>&1

if errorlevel 1 (
    echo.
    echo  ERROR: Registry write failed. Right-click install.bat and choose
    echo  "Run as administrator", then try again.
    pause & exit /b 1
)

echo.
echo  =====================================================
echo    Done! Installation successful.
echo  =====================================================
echo.
echo  Next steps:
echo    1. Go to Chrome Extensions and click the reload
echo       icon on "Open in Profile"
echo    2. Click the arrow icon in your toolbar
echo    3. Go to Manage Profiles and click
echo       "Auto-detect my profiles"
echo.
pause
