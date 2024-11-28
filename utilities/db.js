// services/db.js
const { Pool } = require('pg');

const pool = new Pool({
    // host: 'localhost',
    // user: 'postgres',
    // database: 'chatbot_appointment',
    // password: 'root',
    // port: '5432',
    host: process.env.POSTGRES_DB_HOST,
    user: process.env.POSTGRES_DB_USER,
    database: process.env.POSTGRES_DB_NAME,
    password: process.env.POSTGRES_DB_PASSWORD,
    port: process.env.POSTGRES_DB_PORT,                 
});

module.exports = pool;