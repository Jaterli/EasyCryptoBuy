#!/bin/bash
# ============================================================
# Script de instalación y ejecución para WSL
# Este script:
#   1. Da permisos de ejecución a todos los scripts
#   2. Verifica que git esté disponible
#   3. Muestra información del repositorio
#   4. Ejecuta el script principal de reescritura
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Configurando permisos de ejecución..."
chmod +x "$SCRIPT_DIR/rewrite-all.sh"
chmod +x "$SCRIPT_DIR/rewrite-part1.sh"
chmod +x "$SCRIPT_DIR/rewrite-part2.sh"
chmod +x "$SCRIPT_DIR/rewrite-part3.sh"
chmod +x "$SCRIPT_DIR/rewrite-part4.sh"
chmod +x "$SCRIPT_DIR/rewrite-part5.sh"
chmod +x "$SCRIPT_DIR/install-and-run.sh"
echo "✅ Permisos configurados"
echo ""

# Verificar git
echo "🔍 Verificando git..."
if ! command -v git >/dev/null 2>&1; then
  echo "❌ Error: git no está instalado. Instálalo con:"
  echo "   sudo apt update && sudo apt install git"
  exit 1
fi
echo "✅ Git encontrado: $(git --version)"
echo ""

# Verificar que estamos en un repo git
if [ ! -d ".git" ]; then
  echo "❌ Error: no se encontró el directorio .git"
  echo "   Asegúrate de ejecutar este script en la raíz del repositorio"
  exit 1
fi

echo "📊 Información del repositorio:"
echo "   - Rama actual: $(git rev-parse --abbrev-ref HEAD)"
echo "   - Total commits: $(git rev-list --count HEAD)"
echo "   - Último commit: $(git log -1 --pretty=format:'%h %s')"
echo ""

# Mostrar commits actuales que serán reescritos
echo "📋 Commits actuales (del más reciente al más antiguo):"
echo "----------------------------------------"
git log --oneline | head -68
echo "----------------------------------------"
echo ""

# Preguntar cuántos commits reescribir
read -p "¿Cuántos commits quieres reescribir? [68 = todos, 5 = últimos 5]: " NUM_COMMITS
NUM_COMMITS=${NUM_COMMITS:-68}

echo ""
echo "🎯 Se reescribirán los últimos $NUM_COMMITS commits"
echo ""

# Ejecutar el script principal con el número especificado
TOTAL_COMMITS=$NUM_COMMITS bash "$SCRIPT_DIR/rewrite-all.sh"