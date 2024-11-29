require('dotenv').config();

const Connection = require('./utilities/Connection');
const dbService = new Connection();

const { createBot, createProvider, createFlow } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const PostgreSQLAdapter = require('@bot-whatsapp/database/postgres')
const { flowPrincipal } = require('./flows/appointment');

const main = async () => {
    const adapterDB = new PostgreSQLAdapter({
        host: process.env.POSTGRES_DB_HOST,
        user: process.env.POSTGRES_DB_USER,
        database: process.env.POSTGRES_DB_NAME,
        password: process.env.POSTGRES_DB_PASSWORD,
        port: process.env.POSTGRES_DB_PORT,
    })
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    QRPortalWeb();
    const sqlQuery1 = `
        CREATE TABLE IF NOT EXISTS users (
            dni VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            cellphone VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;
    await dbService.executeQuery(sqlQuery1);
    console.log('🆗 Tabla users existe o fue creada con éxito')


    const intervalId = setInterval(async () => {
        try {
            const sqlQuery = `
            ALTER TABLE history
            ALTER COLUMN refserialize DROP NOT NULL,
            ALTER COLUMN answer DROP NOT NULL;
        `;
            await dbService.executeQuery(sqlQuery);
            console.log('🆗 Alter Table fue ejecutado con éxito')
            clearInterval(intervalId);
        } catch (error) {
            console.error('Error ejecutando alterTable:', error);
        }
    }, 1000);
};

main()
