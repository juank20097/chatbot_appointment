require('dotenv').config();

const DatabaseService = require('./utilities/DatabaseService');
const dbService = new DatabaseService();

const { createBot, createProvider, createFlow} = require('@bot-whatsapp/bot')

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
    const intervalId = setInterval(async () => {
        try {
            await dbService.pre_querys_sql();
            clearInterval(intervalId);
        } catch (error) {
            console.error('Error ejecutando alterTable:', error);
        }
    }, 2000);
    };

main()
