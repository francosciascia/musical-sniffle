@echo off
cd /d "%~dp0..\frontend"
title [NO CERRAR] Musical Sniffle - Frontend
color 2F
set "PATH=C:\Program Files\nodejs;%PATH%"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo Puerto 5173 ocupado ^(PID %%a^). Cerrando instancia anterior...
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul 2>&1

echo.
echo ============================================
echo   FRONTEND  (ventana VERDE)
echo   NO cierres esta ventana mientras uses la app
echo.
echo   App http://localhost:5173
echo ============================================
echo.
call npm.cmd run dev
echo.
echo Frontend detenido. Presiona una tecla para cerrar...
pause >nul
