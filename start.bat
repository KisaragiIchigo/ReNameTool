@echo off
chcp 65001 >nul
pushd "%~dp0"
call npm start
popd
