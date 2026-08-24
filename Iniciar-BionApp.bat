@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado. Descargalo desde https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias la primera vez...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install fallo.
    pause
    exit /b 1
  )
)

node scripts/start-local.mjs --background
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo abrir BionApp.
  pause
  exit /b 1
)

exit /b 0
