@echo off
REM Preferi doble clic en start-dev.vbs (sin ventana extra).
REM Este .cmd solo redirige al VBS y se cierra al instante.
cd /d "%~dp0"
start "" wscript.exe "%~dp0start-dev.vbs"
exit /b 0
