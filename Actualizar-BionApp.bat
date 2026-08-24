@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  BionApp — actualizar
echo  ====================
echo.
echo  Descarga la ultima version desde GitHub e instala dependencias.
echo.
echo  Requisitos: Git y Node.js instalados, y esta carpeta clonada con git clone.
echo  Si descargaste un ZIP, actualiza manualmente desde GitHub.
echo.
echo  Cierra BionApp antes de continuar si esta abierta.
echo.
pause

where git >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Git no esta instalado. Descargalo desde https://git-scm.com/
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js no esta instalado. Descargalo desde https://nodejs.org/
  pause
  exit /b 1
)

if not exist ".git\" (
  echo.
  echo [ERROR] Esta carpeta no es un clon de Git.
  echo Descarga la version nueva desde GitHub y conserva datos\ y .env
  pause
  exit /b 1
)

echo.
echo  Comprobando cambios locales...
git status --porcelain | findstr /R "." >nul 2>&1
if not errorlevel 1 (
  echo.
  echo  [AVISO] Hay archivos modificados en esta carpeta.
  echo  git pull puede fallar o mezclar cambios. Revisa antes de seguir.
  echo.
  choice /C SN /M "Continuar igualmente"
  if errorlevel 2 (
    echo Actualizacion cancelada.
    pause
    exit /b 0
  )
)

echo.
echo  Descargando cambios (git pull)...
git pull
if errorlevel 1 (
  echo.
  echo [ERROR] git pull fallo. Comprueba la conexion a internet y que no haya conflictos.
  pause
  exit /b 1
)

echo.
echo  Instalando dependencias (npm install)...
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] npm install fallo.
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   Actualizacion completada
echo  ========================================
echo.
echo  Si el CHANGELOG indica cambios en la base de datos, puede hacer falta
echo  ejecutar de nuevo: npm run setup:local
echo  (solo si la nueva version lo indica; tus datos en datos\ se conservan).
echo.

choice /C SN /M "Abrir BionApp ahora"
if errorlevel 2 exit /b 0

node scripts/start-local.mjs --background
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo abrir BionApp. Prueba Iniciar-BionApp.bat
  pause
  exit /b 1
)

exit /b 0
