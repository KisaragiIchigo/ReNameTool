@echo off
chcp 65001 >nul
pushd "%~dp0"

echo ===================================================
echo   NovaRename - Release Package Build
echo   Target: Standalone / Portable ZIP + Installer EXE
echo ===================================================
echo.

echo [0/3] Closing running NovaRename instances to prevent file lock...
taskkill /F /IM NovaRename*.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

echo.
echo [1/3] Building frontend and Electron main process...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed.
    pause
    popd
    exit /b %errorlevel%
)

echo.
echo [2/3] Packaging with electron-builder...
call npx electron-builder --config electron-builder.yml --win
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Packaging failed.
    pause
    popd
    exit /b %errorlevel%
)

echo.
echo [3/3] Creating Portable Distribution Zip...
powershell -Command "if (Test-Path 'Release\win-unpacked') { Compress-Archive -Path 'Release\win-unpacked\*' -DestinationPath 'Release\NovaRename_Portable_1.0.0.zip' -Force }"

echo.
echo ===================================================
echo   Build Successful!
echo   Output directory: Release/
echo     - win-unpacked/NovaRename.exe     (Standalone EXE)
echo     - NovaRename_Portable_1.0.0.zip   (Portable ZIP)
echo     - NovaRename_Setup_1.0.0.exe      (Installer EXE)
echo ===================================================
echo.

if exist "Release" (
    explorer Release
)

popd
pause
