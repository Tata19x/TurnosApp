# Script para iniciar TurnosApp Backend y Frontend en PowerShell
# Uso: .\start-dev.ps1

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "     TurnosApp - Sistema de Turnos" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Función para abrir una ventana PowerShell con un comando
function Start-ProcessWindow {
    param(
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$Title
    )
    
    $psPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    
    Start-Process -FilePath $psPath `
                  -ArgumentList "-NoExit -Command `"Set-Location '$WorkingDirectory'; $Command`"" `
                  -WindowStyle Normal
    
    Write-Host "$Title iniciado" -ForegroundColor Green
}

$projectRoot = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent

# Iniciar Backend
Start-ProcessWindow -WorkingDirectory "$projectRoot\backend" `
                    -Command "npm run dev" `
                    -Title "Backend"

# Esperar 3 segundos
Write-Host "Esperando a que el backend se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Iniciar Frontend
Start-ProcessWindow -WorkingDirectory "$projectRoot\frontend" `
                    -Command "npm run dev" `
                    -Title "Frontend"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona ENTER para cerrar este mensaje" -ForegroundColor Yellow
Read-Host