#!/bin/bash
# ============================================================
# Script para reescribir TODOS los commits no descriptivos
# del proyecto EasyCryptoBuy con mensajes siguiendo
# Conventional Commits.
#
# IMPORTANTE: Este script solo modifica los commits cuyo mensaje
# actual es considerado "no descriptivo" (update, update docker, etc.)
# Los commits con mensajes claros se preservan tal cual.
#
# Autor: generado para jt (jaterli@hotmail.com)
# Uso: ejecutar dentro de WSL en la raíz del repositorio.
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Diccionario: hash_corto -> nuevo_mensaje
# Solo se incluyen los commits que necesitan reescribirse.
# Los commits ya buenos (ej. 792375d, 0192c51, etc.) se mantienen.
# ------------------------------------------------------------

# Commit b45d5ba
MSG_b45d5ba="chore(docker): add 2 missing lines to docker-compose.yml"

# Commit 320cd5f
MSG_320cd5f="chore(docker): refactor docker-compose.yml and update backend Dockerfile"

# Commit 102f8ff
MSG_102f8ff="chore(docker): restructure Docker files into docker/ subdirectory and reorganize paths"

# Commit e5b7803
MSG_e5b7803="chore(docker-compose): fix path/config in docker-compose.yml"

# Commit 2558344
MSG_2558344="fix(dockerfile): correct backend Dockerfile command"

# Commit f670d2c
MSG_f670d2c="chore(dockerfile): add missing line to frontend Dockerfile"

# Commit 4ed27df
MSG_4ed27df="chore(frontend): remove unnecessary line from tsconfig.app.json"

# Commit 8c1230b
MSG_8c1230b="fix(dockerfile): correct frontend Dockerfile COPY path"

# Commit c8ed8e4
MSG_c8ed8e4="chore(dockerfile): update backend Dockerfile and requirements.txt"

# Commit ed21034
MSG_ed21034="fix(dockerfile): correct frontend Dockerfile configuration"

# Commit 14107c9
MSG_14107c9="chore(dockerfile): adjust frontend Dockerfile build args"

# Commit 7410f18
MSG_7410f18="chore(docker-compose): add 2 lines to docker-compose.yml"

# Commit 666b376
MSG_666b376="refactor(env): consolidate env files and simplify docker configuration"

# Commit e66d5d6
MSG_e66d5d6="feat(docker): production-ready docker-compose with nginx reverse proxy"

# Commit 3a50b4f
MSG_3a50b4f="feat(deploy): dockerize full application stack (backend + frontend + nginx)"

# Commit 8da17be
MSG_8da17be="feat: complete MVP - cart removal, payment flow and product management"

# Commit 8c83996
MSG_8c83996="feat(payments): add 'confirming' transaction status with database migrations"

# Commit 996593d
MSG_996593d="refactor(payments): clean up payment flow, remove deprecated components"

# Commit ed9ed43
MSG_ed9ed43="feat(products): add product image upload, display and management UI"

# Commit 28b073b
MSG_28b073b="feat(model): add category field to Product model with frontend filter"

# Commit 95a1424
MSG_95a1424="fix(auth): resolve refresh_token issue for company admin users"

# Commit a0f57dd
MSG_a0f57dd="feat(auth): improve JWT token handling and refresh logic"

# Commit 33f021e
MSG_33f021e="fix(web3): resolve Web3Provider service connection error"

# Commit 75e4cd2
MSG_75e4cd2="feat(web3): integrate Web3Provider service for wallet operations"

# Commit d68d584
MSG_d68d584="feat(web3): add wallet connection helper utilities"

# Commit bb3ba3b
MSG_bb3ba3b="feat(web3): implement basic wallet connection flow"

# Commit 512f42f
MSG_512f42f="feat(backend): configure Web3 integration REST endpoints"

# Commit 859ebe4
MSG_859ebe4="feat(backend): add crypto price API integration via CoinGecko"

# Commit d266b9c
MSG_d266b9c="feat(payments): implement transaction history API endpoints"

# Commit 47a0d84
MSG_47a0d84="feat(payments): add user portfolio endpoints"

# Commit b6ba8f7
MSG_b6ba8f7="feat(auth): add JWT authentication endpoints"

# Commit 40f5d79
MSG_40f5d79="feat(backend): initial Django REST framework setup with auth endpoints"

# Commit 7c838ff
MSG_7c838ff="chore(backend): configure Django project structure and apps"

# Commit 58aa792
MSG_58aa792="feat(backend): initial Django app creation (accounts, users)"

# Commit ec3cb3b
MSG_ec3cb3b="chore(deploy): prepare DigitalOcean droplet deployment configuration"

# Commit 313d397
MSG_313d397="feat(user): complete user profile and wallet management"

# Commit 2462c33
MSG_2462c33="chore(backend): minor settings and URL configuration tweaks"

# Commit 180ea93
MSG_180ea93="chore(backend): update dependencies and configuration"

# Commit 4a99a08
MSG_4a99a08="chore(backend): refactor settings and API endpoints"

# Commit 7085607
MSG_7085607="feat(backend): add new API endpoints and serializers"

# Commit 1ac39c9
MSG_1ac39c9="feat(backend): extend payments API with additional endpoints"

# Commit 2a0a2f6
MSG_2a0a2f6="chore(backend): clean up code and minor fixes"

# Commit 297795b
MSG_297795b="feat(user): finish user part of the application"

# Commit 1247091
MSG_1247091="refactor: split frontend into separate User and Company apps"

# Commit 25f2967
MSG_25f2967="feat(auth): enhance user security with signature verification"

# Commit f75598e
MSG_f75598e="refactor(auth): split auth into user/company with separate axios instances"

# Commit 2fdc6fc
MSG_2fdc6fc="feat(backend): reorganize settings.py and integrate CoinGecko service"

# Commit d1931d3
MSG_d1931d3="feat(payments): add purchase_summary field to Transaction model"

# Commit b2fe3ea
MSG_b2fe3ea="fix(cart): clear cart after successful payment and fix Payment render"

# Commit 75bca29
MSG_75bca29="feat(ui): update navbars + empty cart on payment execution"

# Commit 2a4dbac
MSG_2a4dbac="feat(cart): implement shopping cart with context and sync hooks"

# Commit 98af3c5
MSG_98af3c5="feat(ui): improve login pages and apply theme styles"

# Commit 704241e
MSG_704241e="feat(company): NavCompany, ProductForm dialog and product pagination"

# Commit d6a948d
MSG_d6a948d="feat(company): company auth + complete product CRUD operations"

# Commit 885c5e6
MSG_885c5e6="refactor: split App.tsx into User/Company + add company admin login"

# Commit c361e29
MSG_c361e29="refactor: reorganize folder structure + add auth/registration guards"

# Commit 2bd3fe1
MSG_2bd3fe1="chore(prep): pre-restructure cleanup of WalletContext and hooks"

# Commit 8692bc4
MSG_8692bc4="feat(wallet): integrate wallet registration form in payment flow"

# Commit 726b4c8
MSG_726b4c8="feat(ui): add Footer component"

# Commit f971d15
MSG_f971d15="feat(payments): complete customer-side payment integration (Phase 3)"

# Commit f6723dc
MSG_f6723dc="feat(phase5): add dashboard/home page with Chakra UI theme system"

# Commit 4473b6a
MSG_4473b6a="feat(phase4): users app + payments API + wallet integration"

# Commit 74aff61
MSG_74aff61="feat(ui): toaster notifications + wallet signature verification"

# Commit 11e7c26
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
  echo "     git checkout -b chore/rewrite-all-commits"
  echo ""
  read -p "¿Deseas continuar de todos modos? (s/N): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[sSyY]$ ]]; then
    echo "❌ Operación cancelada."
    exit 1
  fi
fi

# Backup de seguridad
BACKUP_BRANCH="backup/commits-before-rewrite-all-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" >/dev/null
echo "💾 Backup creado en la rama: $BACKUP_BRANCH"
echo ""

# Confirmar que el usuario quiere continuar
read -p "⚠️  Se reescribirán TODOS los commits no descriptivos. ¿Continuar? (s/N): " CONFIRM
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
echo "🚀 Reescribiendo todos los commits no descriptivos (total: $TOTAL_COMMITS)..."
echo ""

# ------------------------------------------------------------
# Filtro: si existe un archivo msg-<hash>.txt, lo usa
# Si no existe, mantiene el mensaje original (commits ya buenos)
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
echo "✅ Commits reescritos correctamente."
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