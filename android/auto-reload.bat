@echo off
echo 🔥 Only Coffee Auto Hot Reload Starting...
echo.
echo This will watch for file changes and automatically rebuild/deploy your app.
echo Press Ctrl+C to stop watching.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0auto-reload.ps1" %*
