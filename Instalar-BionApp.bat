@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  BionApp — instalacion
echo  =====================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado. Descargalo desde https://nodejs.org/
  pause
  exit /b 1
)

call npm run setup
set EXIT_CODE=%ERRORLEVEL%

if exist "datos\.setup-launched" (
  del "datos\.setup-launched" >nul 2>&1
  echo.
  echo  La app se abrio en otra ventana. Cerrando instalador...
  timeout /t 2 /nobreak >nul
  exit /b 0
)

if %EXIT_CODE%==2 (
  echo.
  echo  La app se abrio en otra ventana. Cerrando instalador...
  timeout /t 2 /nobreak >nul
  exit /b 0
)

if %EXIT_CODE% neq 0 (
  echo.
  echo [ERROR] La instalacion no termino correctamente.
  pause
  exit /b %EXIT_CODE%
)

echo.
pause
exit /b 0
