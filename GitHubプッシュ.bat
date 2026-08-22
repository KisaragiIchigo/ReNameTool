@echo off
chcp 65001 >nul
pushd "%~dp0"

echo ===================================================
echo   NovaRename - Push to GitHub
echo   Repository: https://github.com/KisaragiIchigo/ReNameTool.git
echo ===================================================
echo.

echo 1. Staging files...
git add .

echo 2. Committing changes...
git commit -m "NovaRename: update" 2>nul

echo 3. Pushing to GitHub (origin main --force)...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Please check authentication and network.
) else (
    echo.
    echo ===================================================
    echo   Push Completed Successfully!
    echo   https://github.com/KisaragiIchigo/ReNameTool
    echo ===================================================
)

echo.
popd
pause
