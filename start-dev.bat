@echo off
REM Script para iniciar TurnosApp Backend y Frontend en Windows
set "PROJECT_ROOT=%~dp0"

echo ====================================
echo     TurnosApp - Sistema de Turnos
echo ====================================
echo.

REM Abrir terminal para Backend
start "TurnosApp Backend" cmd.exe /k "cd /d ""%PROJECT_ROOT%backend"" && npm run dev"
echo Backend iniciado en http://localhost:3000

REM Esperar 3 segundos antes de abrir Frontend
timeout /t 3 /nobreak

REM Abrir terminal para Frontend
start "TurnosApp Frontend" cmd.exe /k "cd /d ""%PROJECT_ROOT%frontend"" && npm run dev"
echo Frontend iniciado en http://localhost:5173

echo.
echo ====================================
echo Presiona ENTER para cerrar este mensaje
echo ====================================
pause
