# Importar la imagen base de Node.js
FROM node:18-bullseye AS bot

# Instalar dependencias del sistema necesarias para sharp y configuración general
RUN apt-get update && apt-get install -y \
    libvips-dev \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates && \
    update-ca-certificates --fresh && \
    npm config set strict-ssl false

# Configurar entorno para ignorar certificados autofirmados (si es necesario)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Cambiar timezone al servidor
ENV TZ=America/Guayaquil
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Metadata
LABEL version="1.0"
LABEL name="Nodejs - Chatbot_Whatsapp_Bayleis"

# Definir directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias generales y luego `sharp` independientemente para asegurar su correcta instalación
RUN npm install && \
    npm install sharp --ignore-scripts=false --foreground-scripts --verbose

# Copiar el resto del proyecto
COPY . .

# Argumentos para configuración de variables de entorno y puerto
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT


# Comando de inicio
CMD ["npm", "start"]
