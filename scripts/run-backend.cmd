@echo off
cd /d "%~dp0..\backend"
title [NO CERRAR] Musical Sniffle - Backend
color 1F

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  echo Puerto 8080 ocupado ^(PID %%a^). Cerrando instancia anterior...
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul 2>&1

echo.
echo ============================================
echo   BACKEND  (ventana AZUL)
echo   NO cierres esta ventana mientras uses la app
echo.
echo   API     http://localhost:8080
echo   Swagger http://localhost:8080/swagger-ui.html
echo ============================================
echo.
call mvnw.cmd spring-boot:run
echo.
echo Backend detenido. Presiona una tecla para cerrar...
pause >nul
