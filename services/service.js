require('dotenv').config();
const axios = require('axios');
const https = require('https');

// Crear un agente que ignore la validación del certificado
const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

class MyService {
    constructor(baseURL) {
        // Inicializa la instancia de axios con una URL base para todas las peticiones
        this.api = axios.create({
            baseURL: baseURL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            },
            httpsAgent: httpsAgent
        });
    }

    // Método para realizar una petición GET
    async getData(endpoint) {
        this.access_token = await this.getAccessToken(); 
        try {
             // Realiza la petición GET incluyendo el access_token en los encabezados
        const response = await this.api.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${this.access_token}`
            }
        });
            return response.data; // Retorna la data obtenida de la respuesta
        } catch (error) {
            console.error('Error al hacer la petición GET:', error.message);
            throw error;
        }
    }

    // Método para realizar una petición POST
async postData(endpoint, data) {
    this.access_token = await this.getAccessToken();
    try {
        // Realiza la solicitud POST con datos y parámetros adicionales
        const response = await this.api.post(endpoint, data, {
            headers: {
                'Authorization': `Bearer ${this.access_token}`
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error al hacer la petición POST:', error.message);
        throw error;
    }
}

    // Método para realizar una petición PUT
    async putData(endpoint, data) {
        this.access_token = await this.getAccessToken();
        try {
            const response = await this.api.put(endpoint, data,{
                headers: {
                    'Authorization': `Bearer ${this.access_token}`
                }
                });
            return response.data;
        } catch (error) {
            console.error('Error al hacer la petición PUT:', error.message);
            throw error;
        }
    }

    // Método para realizar una petición DELETE
    async deleteData(endpoint) {
        this.access_token = await this.getAccessToken();
        try {
            const response = await this.api.delete(endpoint,{
                headers: {
                    'Authorization': `Bearer ${this.access_token}`
                }
                });
            return response.data;
        } catch (error) {
            console.error('Error al hacer la petición DELETE:', error.message);
            throw error;
        }
    }

    // Método para obtener el access_token
    async getAccessToken() {
        try {
            // Los parámetros para la solicitud, generalmente para OAuth2.
            const data = new URLSearchParams();
            data.append('grant_type', 'refresh_token');
            data.append('client_id', process.env.CLIENT_ID);
            data.append('client_secret', process.env.CLIENT_SECRET);
            data.append('refresh_token', process.env.REFRESH_TOKEN);
            const response = await this.api.post(process.env.URL_TOKEN, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            // Retorna el access_token obtenido
            return response.data.access_token;
        } catch (error) {
            console.error('Error al obtener el access token:', error.message);
            throw error;
        }
    }
}

module.exports = MyService;
