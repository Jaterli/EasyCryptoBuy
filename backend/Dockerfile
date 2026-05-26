FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema (útiles para psycopg2, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar el resto del código
COPY . .

# Recopilar archivos estáticos (importante)
RUN python manage.py collectstatic --noinput

# Puerto en el que correrá Gunicorn
EXPOSE 8000

# Comando para correr Gunicorn (conexión a socket o host)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "tu_proyecto.wsgi:application"]