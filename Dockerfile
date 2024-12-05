#Import to node
FROM node:18-bullseye as bot

# Instalar dependencias del sistema necesarias para sharp
RUN apt-get update && apt-get install -y libvips-dev

# Definition of Metadata

LABEL version="1.0"
LABEL name="Nodejs - Chatbot_Whatsapp_Bayleis"

#Change timezone to server

ENV TZ=America/Guayaquil
USER root
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Configurar npm para ignorar problemas de certificados
RUN npm config set strict-ssl false

#Construction

WORKDIR /app
COPY package*.json ./
RUN npm install && \
    npm install --ignore-scripts=false --foreground-scripts --verbose sharp
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
CMD ["npm", "start"]
