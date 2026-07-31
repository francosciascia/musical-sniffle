# Musical Sniffle - levanta backend + frontend (PostgreSQL local)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbs = Join-Path $root "start-dev.vbs"

Write-Host ""
Write-Host "Abriendo backend y frontend..." -ForegroundColor Cyan
Write-Host "(Esta ventana se cierra sola; quedan 2 ventanas AZUL y VERDE)" -ForegroundColor Gray
Write-Host ""

Start-Process wscript.exe -ArgumentList "`"$vbs`""
Start-Sleep -Seconds 1
exit 0
