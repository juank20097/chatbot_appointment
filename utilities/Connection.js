const { Pool } = require('pg');

class Connection {
    constructor() {
        this.pool = new Pool({
            host: process.env.POSTGRES_DB_HOST,
            user: process.env.POSTGRES_DB_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_DB_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
        });
    }

    // Método para ejecutar consultas SQL usando el pool
async executeQuery(query, params = []) {
    try {
        // Si no hay parámetros, ejecuta solo la consulta
        const result = params.length > 0 
            ? await this.pool.query(query, params) 
            : await this.pool.query(query); // Ejecutar la consulta sin parámetros
        return result;  // Devuelve el objeto completo de resultado
    } catch (error) {
        console.error('Error ejecutando la consulta:', error.stack);
        throw error;
    }
}

    // Método para cerrar el pool de conexiones
    async disconnect() {
        try {
            await this.pool.end();
        } catch (error) {
            console.error('Error al cerrar el pool de conexiones:', error);
        }
    }
}

module.exports = Connection;