@echo off
REM Script para iniciar TurnosApp Backend y Frontend en Windows

echo ====================================
echo     TurnosApp - Sistema de Turnos
echo ====================================
echo.

REM Abrir terminal para Backend
start cmd.exe /k "cd %CD%\backend && npm run dev"
echo Backend iniciado en http://localhost:3000

REM Esperar 3 segundos antes de abrir Frontend
timeout /t 3 /nobreak

REM Abrir terminal para Frontend
start cmd.exe /k "cd %CD%\frontend && npm run dev"
echo Frontend iniciado en http://localhost:5173

echo.
echo ====================================
echo Presiona ENTER para cerrar este mensaje
echo ====================================
pause