#!/usr/bin/env bash
cd "$(dirname "$0")"

echo ""
echo "  BionApp — modo local"
echo "  ===================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js no está instalado. Descárgalo desde https://nodejs.org/"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Instalando dependencias la primera vez..."
  npm install || exit 1
fi

node scripts/start-local.mjs --background
