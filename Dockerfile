#Import to node
FROM node:18-bullseye as bot

# Definition of Metadata

LABEL version="1.0"
LABEL name="Nodejs - Chatbot_Whatsapp_Bayleis"

#Change timezone to server

ENV TZ=America/Guayaquil
USER root
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

#Construction

WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
CMD ["npm", "start"]
