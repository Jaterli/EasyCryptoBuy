#!/bin/bash
# ============================================================
# Script para reescribir TODOS los commits del proyecto
# EasyCryptoBuy aplicando Conventional Commits a TODOS,
# incluyendo los que ya tienen mensajes descriptivos.
#
# Versión 2: reescritura completa del historial.
#
# Autor: generado para jt (jaterli@hotmail.com)
# Uso: ejecutar dentro de WSL en la raíz del repositorio.
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Diccionario: hash_corto -> nuevo_mensaje
# Cubre TODOS los commits del repositorio, sin excepciones.
# ------------------------------------------------------------

# Commits más recientes (HEAD)
MSG_c05c3b6="chore(scripts): add installation and execution script for WSL with git verification"
MSG_ad9df46="refactor(serializers): remove unused image field from ProductSerializer"
MSG_f2b75af="feat(serializers): add image URL SerializerMethodField to ProductSerializer"
MSG_40d3d2a="feat(settings): add HTTPS/SSL config for production deployment behind reverse proxy"
MSG_7df2cfe="chore(docker): optimize frontend Dockerfile build steps"
MSG_ee3de2a="chore(docker): simplify docker-compose service definitions"
MSG_b45d5ba="chore(docker): add missing configuration lines to docker-compose.yml"
MSG_320cd5f="chore(docker): refactor docker-compose.yml and update backend Dockerfile"
MSG_102f8ff="chore(docker): restructure Docker files into docker/ subdirectory and reorganize paths"
MSG_e5b7803="chore(docker-compose): fix path and configuration in docker-compose.yml"
MSG_2558344="fix(dockerfile): correct backend Dockerfile command"
MSG_f670d2c="chore(dockerfile): add missing line to frontend Dockerfile"
MSG_4ed27df="chore(frontend): remove unnecessary line from tsconfig.app.json"
MSG_8c1230b="fix(dockerfile): correct frontend Dockerfile COPY path"
MSG_c8ed8e4="chore(dockerfile): update backend Dockerfile and requirements.txt"
MSG_ed21034="fix(dockerfile): correct frontend Dockerfile configuration"
MSG_14107c9="chore(dockerfile): adjust frontend Dockerfile build args"
MSG_7410f18="chore(docker-compose): add missing configuration to docker-compose.yml"
MSG_666b376="refactor(env): consolidate env files and simplify docker configuration"
MSG_e66d5d6="feat(docker): production-ready docker-compose with nginx reverse proxy"
MSG_3a50b4f="feat(deploy): dockerize full application stack (backend + frontend + nginx)"
MSG_8da17be="feat: complete MVP - cart removal, payment flow and product management"
MSG_8c83996="feat(payments): add 'confirming' transaction status with database migrations"
MSG_996593d="refactor(payments): clean up payment flow, remove deprecated components"
MSG_ed9ed43="feat(products): add product image upload, display and management UI"
MSG_28b073b="feat(model): add category field to Product model with frontend filter"
MSG_0192c51="docs: create comprehensive project README.md"
MSG_95a1424="fix(auth): resolve refresh_token issue for company admin users"
MSG_a0f57dd="feat(auth): improve JWT token handling and refresh logic"
MSG_33f021e="fix(web3): resolve Web3Provider service connection error"
MSG_75e4cd2="feat(web3): integrate Web3Provider service for wallet operations"
MSG_d68d584="feat(web3): add wallet connection helper utilities"
MSG_bb3ba3b="feat(web3): implement basic wallet connection flow"
MSG_512f42f="feat(backend): configure Web3 integration REST endpoints"
MSG_859ebe4="feat(backend): add crypto price API integration via CoinGecko"
MSG_d266b9c="feat(payments): implement transaction history API endpoints"
MSG_47a0d84="feat(payments): add user portfolio endpoints"
MSG_b6ba8f7="feat(auth): add JWT authentication endpoints"
MSG_40f5d79="feat(backend): initial Django REST framework setup with auth endpoints"
MSG_7c838ff="chore(backend): configure Django project structure and apps"
MSG_58aa792="feat(backend): initial Django app creation (accounts, users)"
MSG_ec3cb3b="chore(deploy): prepare DigitalOcean droplet deployment configuration"
MSG_313d397="feat(user): complete user profile and wallet management"
MSG_2462c33="chore(backend): minor settings and URL configuration tweaks"
MSG_180ea93="chore(backend): update dependencies and configuration"
MSG_4a99a08="chore(backend): refactor settings and API endpoints"
MSG_7085607="feat(backend): add new API endpoints and serializers"
MSG_1ac39c9="feat(backend): extend payments API with additional endpoints"
MSG_2a0a2f6="chore(backend): clean up code and minor fixes"
MSG_297795b="feat(user): finish user part of the application"
MSG_1247091="refactor: split frontend into separate User and Company apps"
MSG_25f2967="feat(auth): enhance user security with signature verification"
MSG_f75598e="refactor(auth): split auth into user/company with separate axios instances"
MSG_2fdc6fc="feat(backend): reorganize settings.py and integrate CoinGecko service"
MSG_d1931d3="feat(payments): add purchase_summary field to Transaction model"
MSG_b2fe3ea="fix(cart): clear cart after successful payment and fix Payment render"
MSG_75bca29="feat(ui): update navbars + empty cart on payment execution"
MSG_2a4dbac="feat(cart): implement shopping cart with context and sync hooks"
MSG_98af3c5="feat(ui): improve login pages and apply theme styles"
MSG_704241e="feat(company): NavCompany, ProductForm dialog and product pagination"
MSG_d6a948d="feat(company): company auth + complete product CRUD operations"
MSG_885c5e6="refactor: split App.tsx into User/Company + add company admin login"
MSG_c361e29="refactor: reorganize folder structure + add auth/registration guards"
MSG_2bd3fe1="chore(prep): pre-restructure cleanup of WalletContext and hooks"
MSG_8692bc4="feat(wallet): integrate wallet registration form in payment flow"
MSG_726b4c8="feat(ui): add Footer component to app layout"
MSG_f971d15="feat(payments): complete customer-side payment integration (Phase 3)"
MSG_f6723dc="feat(phase5): add dashboard/home page with Chakra UI theme system"
MSG_4473b6a="feat(phase4): users app + payments API + wallet integration"
MSG_74aff61="feat(ui): toaster notifications + wallet signature verification"
MSG_11e7c26="feat(phase2): initial project setup with Chakra UI (Django + React)"

# ------------------------------------------------------------
# Validaciones previas
# ------------------------------------------------------------
if [ ! -d ".git" ]; then
  echo "❌ Error: este script debe ejecutarse dentro de la raíz del repositorio Git."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "❌ Error: git no está instalado o no está en el PATH."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Rama actual: $CURRENT_BRANCH"

# Aviso de seguridad
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "⚠️  Estás en la rama principal ($CURRENT_BRANCH)."
  echo "   Se recomienda crear una rama de trabajo para hacer el rebase:"
  echo "     git checkout -b chore/rewrite-all-commits-v2"
  echo ""
  read -p "¿Deseas continuar de todos modos? (s/N): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[sSyY]$ ]]; then
    echo "❌ Operación cancelada."
    exit 1
  fi
fi

# Backup de seguridad
BACKUP_BRANCH="backup/commits-before-rewrite-all-v2-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" >/dev/null
echo "💾 Backup creado en la rama: $BACKUP_BRANCH"
echo ""

# Confirmar que el usuario quiere continuar
read -p "⚠️  Se reescribirán TODOS los commits del repositorio. ¿Continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sSyY]$ ]]; then
  echo "❌ Operación cancelada."
  exit 1
fi
echo ""

# ------------------------------------------------------------
# Crear directorio temporal con los mensajes por hash
# ------------------------------------------------------------
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Recorrer todas las variables MSG_* y crear archivos msg-<hash>.txt
for var in $(compgen -A variable | grep '^MSG_'); do
  HASH="${var#MSG_}"
  MSG_CONTENT="${!var}"
  printf "%s" "$MSG_CONTENT" > "$TMP_DIR/msg-$HASH.txt"
done

TOTAL_COMMITS=$(git rev-list --count HEAD)
echo "🚀 Reescribiendo TODOS los commits del repositorio (total: $TOTAL_COMMITS)..."
echo ""

# ------------------------------------------------------------
# Filtro: lee el hash del commit actual y busca el archivo
# msg-<hash>.txt correspondiente. Si existe, usa ese mensaje.
# Si no existe (caso improbable), mantiene el original.
# ------------------------------------------------------------
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --msg-filter "
TMP_DIR='$TMP_DIR'
HASH=\$(echo \$GIT_COMMIT | cut -c1-7)
MSG_FILE=\"\$TMP_DIR/msg-\$HASH.txt\"
if [ -f \"\$MSG_FILE\" ]; then
  cat \"\$MSG_FILE\"
else
  cat
fi
" -- --all

echo ""
echo "✅ Todos los commits reescritos correctamente."
echo ""
echo "📋 Historial actualizado:"
echo "----------------------------------------"
git log --oneline
echo "----------------------------------------"
echo ""
echo "💡 Si algo salió mal, puedes restaurar la rama original con:"
echo "   git reset --hard $BACKUP_BRANCH"
echo ""
echo "📤 Si quieres subir los cambios al remoto (CUIDADO: es --force):"
echo "   git push --force-with-lease origin $CURRENT_BRANCH"
echo ""
echo "🔍 Para comparar los hashes antes y después:"
echo "   git log --all --oneline | head -20"
echo ""