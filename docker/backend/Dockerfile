FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias del sistema (útiles para psycopg2, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev python3-dev && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar el resto del código
COPY ./backend/ /app/

# Script de entrada para ejecutar Gunicorn
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Exponer el puerto de la API
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
