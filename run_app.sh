#!/bin/bash

# Ruta al backend y frontend
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Función para matar los procesos al salir
cleanup() {
    echo "Deteniendo la aplicación..."
    kill $BACKEND_PID $LISTENER_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT

# Ejecutar backend
cd $BACKEND_DIR
source env/bin/activate &
python3 manage.py runserver &
BACKEND_PID=$!

# python3 manage.py listener &
# LISTENER_PID=$!

# Volver al directorio raíz y ejecutar frontend
cd ..
cd $FRONTEND_DIR
yarn dev &
FRONTEND_PID=$!

# Esperar a que todos los procesos terminen
wait