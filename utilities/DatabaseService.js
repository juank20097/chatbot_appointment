require('dotenv').config();
const { Client } = require('pg');

class DatabaseService {
    constructor() {
        // Configurar la conexión a la base de datos
        this.client = new Client({
            host: process.env.POSTGRES_DB_HOST,
            user: process.env.POSTGRES_DB_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_DB_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
        });
    }

    // Método para conectar a la base de datos
    async connect() {
        try {
            await this.client.connect();
        } catch (error) {
            console.error('Error al conectar a la base de datos:', error);
        }
    }

    // Método para ejecutar consultas SQL
    async executeQuery(query) {
        try {
            await this.client.query(query);
        } catch (error) {
            console.error('Error ejecutando la consulta:', error.stack);
        }
    }

    async disconnect() {
        try {
            await this.client.end();
        } catch (error) {
            console.error('Error al cerrar la conexión:', error);
        }
    }

    async pre_querys_sql() {
        const sqlQuery = `
            ALTER TABLE history
            ALTER COLUMN refserialize DROP NOT NULL,
            ALTER COLUMN answer DROP NOT NULL;
        `;
        const sqlQuery1 = `
        CREATE TABLE IF NOT EXISTS users (
            dni VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            cellphone VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `;
        try {
            await this.connect();
            await this.executeQuery(sqlQuery);
            console.log('🆗 Alter-Table ejecutado con éxito');
            await this.executeQuery(sqlQuery1);
            console.log('🆗 Tabla users existe o fue creada con éxito');
        } catch (error) {
            console.error('Error ejecutando el pre_querys_sql:', error);
        } finally {
            await this.disconnect();
        }
    }
}

module.exports = DatabaseService;
