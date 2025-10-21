# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STREAMLIT_SERVER_HEADLESS=true

# Instalar dependências de sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Copiar requisitos e instalar dependências Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código do aplicativo
COPY app.py ./

# Expor porta padrão do Streamlit (Render usa variável PORT automaticamente)
EXPOSE 8501

# Comando de inicialização (usa porta fornecida pelo ambiente)
CMD streamlit run app.py --server.port $PORT --server.address 0.0.0.0