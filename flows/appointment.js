require('dotenv').config();

const { addKeyword } = require('@bot-whatsapp/bot');
const Utilities = require('../utilities/utilities');
const ServiceCalendar = require('../services/serviceCalendar');
const ServiceUser = require('../services/serviceUser');
const User = require('../models/user');

const sessions = {};

const serviceCalendar = new ServiceCalendar();
const serviceUser = new ServiceUser();
const utilities = new Utilities();

let user = new User();
let date = '';
let view_options = '';
let options = '';
let startTimeF = '';
let endTimeF = '';
let dni = '';

function startInactivityTimer(userId, gotoFlow, ctx) {
    // Si ya existe un temporizador para este usuario, lo limpiamos.
    if (sessions[userId]?.timeout) {
        clearTimeout(sessions[userId].timeout);
    }

    // Configuramos un nuevo temporizador de 5 minutos.
    sessions[userId] = {
        ...sessions[userId],
        timeout: setTimeout(() => {
            console.log(`⏳ Tiempo de inactividad excedido para el usuario: ${userId}`);
            gotoFlow(flowCierre).then(() => {
                console.log(`🔄 Redirigiendo a flowCierre para: ${userId}`);
            });
        }, 300000), // 5 minutos en milisegundos
    };
}

function clearInactivityTimer(userId) {
    if (sessions[userId]?.timeout) {
        clearTimeout(sessions[userId].timeout);
        delete sessions[userId].timeout;
    }
}

/*------------------------------Métodos de cierre de sessión------------------------------------*/

const flowCierre = addKeyword([''])
    .addAnswer(
        '⏳ Tiempo de inactividad excedido......',
        async (ctx) => {
            const userId = ctx.from;
            clearInactivityTimer(userId); // Limpia el temporizador de este usuario.
        })
    .addAnswer(
        '¡Gracias por comunicarte! 😊 Si necesitas algo más, no dudes en contactarnos.')
    .addAnswer(
        '👨‍💻 *Información del Desarrollador:* \n' +
        '📛 *Nombre:* Juan Carlos Estévez Hidalgo \n' +
        '📧 *Correo:* juank20097@gmail.com \n' +
        '📱 *Teléfono:* +593 980365958 \n' +
        '📂 *Repositorio GitHub:* https://github.com/juank20097 \n')

const flowSigner = addKeyword([''])
    .addAnswer(
        '✅ El proceso ha finalizado con éxito.')
    .addAnswer(
        '👨‍💻 *Información del Desarrollador:* \n' +
        '📛 *Nombre:* Juan Carlos Estévez Hidalgo \n' +
        '📧 *Correo:* juank20097@gmail.com \n' +
        '📱 *Teléfono:* +593 980365958 \n' +
        '📂 *Repositorio GitHub:* https://github.com/juank20097 \n')

const flowClose = addKeyword('')
    .addAnswer(
        '🎉 ¡Cita agendada con éxito! 📅 Revisa tu correo para más detalles.'
    )
    .addAnswer([
        '🔄 *¿Hay algo más en lo que pueda ayudarte? 😊*',
        '👉 *1.* Sí',
        '👉 *2.* No'
    ],
        { capture: true },
        async (ctx, { gotoFlow, fallBack }) => {
            const respuesta = ctx.body.trim();
            console.log('✅ ayuda capturada:', respuesta);
            if (respuesta === '1' || respuesta === 'si' || respuesta === 'SI' || respuesta === 'Si') {
                return gotoFlow(flowPrincipal);
            } else if (respuesta === '2' || respuesta === 'no' || respuesta === 'No' || respuesta === 'NO') {
                return gotoFlow(flowSigner);
            } else {
                return fallBack();
            }
        }
    )

/*--------------------------------flows de Cierre y Despedida------------------------------------------------*/
const flowValidateDni2 = addKeyword(dni)
    .addAnswer([
        '🔄 *¿El dato ingresado es correcto?*',
        '👉 *1.* Sí',
        '👉 *2.* No'
    ],
        { capture: true },
        async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);

            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ validación capturada:', respuesta);
            if (respuesta === '1' || respuesta === 'si' || respuesta === 'SI' || respuesta === 'Si') {
                user = await serviceCalendar.
                console.log(user);
            } else if (respuesta === '2' || respuesta === 'no' || respuesta === 'No' || respuesta === 'NO') {
                await flowDynamic('🚨 Lamento que el dato este incorrecto. ¡Intentémoslo de nuevo! 🔄')
                return gotoFlow(flowDni);
            } else {
                return fallBack();
            }
        }
    );

const flowVerificar = addKeyword(['2'])
    .addAction((ctx, { gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, ctx);
        dni = '';
    })
    .addAnswer(['📄 Por favor, ingresa tu número de cédula o pasaporte para buscar la cita respectiva. 🔍',
    ],
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);
            dni = ctx.body.trim();
            console.log('✅ DNI capturada:', dni);
            return await flowDynamic('✅ Has ingresado el dato: ' + dni);
        },
        [flowValidateDni2]
    )

/*--------------------------------------------2) Verificar-------------------------------------------------------------*/
const flowEmail = addKeyword('')
    .addAnswer(
        `¡Gracias, ${user.name}! 🙏 Por favor, ingresa tu correo para enviarte los detalles de tu cita.`,
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);

            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ correo capturada:', respuesta);
            user.email = respuesta;
            user.cellphone = ctx.from.split('@')[0];
            await flowDynamic('✅ Has ingresado el correo: ' + user.email);
            await serviceUser.createUser(user.dni, user.name, user.email, user.cellphone);
            return await serviceCalendar.createEvent(user.name, user.dni, user.email, date, startTimeF, endTimeF);
        },
        [flowClose]
    )

const flowUser = addKeyword('1', 'si')
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, ctx);

        if (user !== null) {
            await flowDynamic(`¡Hola ${user.name}! 👋 Un placer tenerte de nuevo.`)
            await serviceCalendar.createEvent(user.name, user.dni, user.email, date, startTimeF, endTimeF);
            return gotoFlow(flowClose);
        } else {
            user = new User();
        }
    })
    .addAnswer(
        '❌ No te encontramos en nuestro sistema. 😔 Ingresa tu nombre completo, por favor.',
        { capture: true },
        async (ctx, {  gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);
            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ nombre capturada:', respuesta);
            user.dni = dni;
            user.name = respuesta;
            return await flowDynamic('✅ Has ingresado el nombre: ' + user.name);
        },
        [flowEmail]
    )


const flowValidateDni = addKeyword(dni)
    .addAnswer([
        '🔄 *¿El dato ingresado es correcto?*',
        '👉 *1.* Sí',
        '👉 *2.* No'
    ],
        { capture: true },
        async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);

            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ validación capturada:', respuesta);
            if (respuesta === '1' || respuesta === 'si' || respuesta === 'SI' || respuesta === 'Si') {
                user = await serviceUser.getUserByDni(dni);
                console.log(user);
            } else if (respuesta === '2' || respuesta === 'no' || respuesta === 'No' || respuesta === 'NO') {
                await flowDynamic('🚨 Lamento que el dato este incorrecto. ¡Intentémoslo de nuevo! 🔄')
                return gotoFlow(flowDni);
            } else {
                return fallBack();
            }
        },
        [flowUser]
    );

const flowDni = addKeyword(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    .addAnswer(['🌟 ¡Estamos casi listos!',
        '',
        'Por favor, comparte tu número de cédula de identidad o pasaporte para completar tu agendamiento. 😊'
    ],
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);

            if (!ctx.session) ctx.session = {}; // Asegurarse de que ctx.session esté inicializado
            dni = ctx.body.trim();
            console.log('✅ DNI capturado:', dni);
            return await flowDynamic('✅ Has ingresado el dato: ' + dni);
        },
        [flowValidateDni]
    );

const flowValidateDate = addKeyword([date])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, ctx);
        if (!utilities.validateDateFormat(date)) {
            await flowDynamic('⚠️ *Ups... Algo no está bien.* La fecha que ingresaste no está en formato válida.');
            return gotoFlow(flowAgendar);
        }
        if (!utilities.validateDateNotInPast(date)) {
            await flowDynamic('⚠️ *Ups... Algo no está bien.* La fecha ingresada es pasada.🙏 Selecciona otra fecha.');
            return gotoFlow(flowAgendar);
        }

        date = utilities.castDateFormat(date);
        console.log('✅ Fecha válida:', date);

        const dayOfWeek = utilities.getDayOfWeek(date);
        const isSaturday = dayOfWeek === 6;
        const isSunday = dayOfWeek === 0;

        if (isSaturday && process.env.SaturdayWork === 'false') {
            await flowDynamic('⚠️ La fecha es un *Sábado* 📅, y no ofrecemos atención ese día. 🙏 Selecciona otra fecha.');
            return gotoFlow(flowAgendar);
        }
        if (isSunday && process.env.SundayWork === 'false') {
            await flowDynamic('⚠️ La fecha es un *Domingo* 📅, y no ofrecemos atención ese día. 🙏 Selecciona otra fecha.');
            return gotoFlow(flowAgendar);
        }

        const blackList = JSON.parse(process.env.BlackList || '[]');
        if (blackList.includes(date)) {
            await flowDynamic('🚫 Lo sentimos, la fecha seleccionada no está disponible.🙏 Selecciona otra fecha.');
            return gotoFlow(flowAgendar);
        }
    })
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const serv = await serviceCalendar.getEventsByDate(date).catch(error => {
            console.error('Error al obtener eventos:', error.message);
        });

        const events = (serv?.items || []).map(item => ({
            start: item.start.dateTime,
            end: item.end.dateTime,
        }));

        options = utilities.generateTimeSlots(
            date, process.env.startTime, process.env.endTime,
            process.env.duration, process.env.lunchTimeStart,
            process.env.lunchTimeEnd, events
        );

        if (!options || options.length === 0) {
            await flowDynamic(`🚫 *NO* hay citas disponibles para la fecha seleccionada.🙏 Selecciona otra fecha.`);
            return gotoFlow(flowAgendar);
        }

        view_options = options
            .map((slot, index) => `${index + 1}) ${slot}`)
            .join('\n');
        await flowDynamic([
            '📅 Por favor, ingresa el número de la cita que deseas agendar:',
            '',
            `${view_options}`,
        ]);
    })
    .addAnswer([
        '99) Cambiar Fecha',
    ], { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);
            const respuesta = ctx.body.trim();
            console.log('✅ Respuesta capturada:', respuesta);

            if (respuesta === '99') {
                await flowDynamic('🔄 Cambiando la fecha seleccionada...');
                return gotoFlow(flowAgendar);
            } else if (/^\d+$/.test(respuesta) && respuesta > 0 && respuesta <= options.length) {
                const { startTime, endTime } = utilities.getTimeSlot(respuesta, options);
                startTimeF = startTime
                endTimeF = endTime
                console.log('🕒 Horas capturadas:', startTimeF, endTimeF);
                return await flowDynamic([{ body: `*Cita seleccionada*: ${date}, ${startTimeF}-${endTimeF}` }]);
            } else {
                await flowDynamic('😕 ¡Parece que el dato ingresado no está en nuestra lista! No te preocupes, vamos a intentarlo de nuevo. 😊');
                return gotoFlow(flowAgendar);
            }
        },
        [flowDni]
    );

const flowAgendar = addKeyword(['1'])
    .addAction((ctx, { gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, ctx);
        user = new User();
        date = '';
        view_options = '';
        options = '';
        startTimeF = '';
        endTimeF = '';
        dni = '';
    })
    .addAnswer(['🗓️ Para agendar tu cita, indícanos la fecha en la que deseas programarla.',
        '',
        'Por favor, asegúrate de escribir la fecha en el siguiente formato: *(DD/MM/AAAA)*.'
    ],
        { capture: true },
        async (ctx, { gotoFlow }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, ctx);
            const respuesta = ctx.body.trim();
            console.log('✅ Fecha capturada:', respuesta);
            date = respuesta;
        },
        [flowValidateDate]
    )

/*-----------------------------------1) Agendar----------------------------------*/

const flowPrincipal = addKeyword(['citas'])
    .addAction((ctx, { gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, ctx); // Inicia o reinicia el temporizador.
    })
    .addAnswer('👋 ¡Hola! Bienvenido al sistema de agendamiento de citas.')
    .addAnswer('Soy SON 🤖, tu asistente virtual, y estaré encantado de ayudarte a coordinar tu cita de manera rápida y sencilla. 📅✨ Vamos a comenzar.')
    .addAnswer([
        '📌 Por favor, ingresa el número de la opción que deseas realizar:',
        '',
        '1️⃣ Agendar Cita 📅',
        '2️⃣ Verificar Cita 🔍',
        '3️⃣ Cambiar Cita 🔄',
        '4️⃣ Cancelar Cita ❌ '
    ],
        { capture: true },
        async (ctx, { fallBack, gotoFlow }) => {
            const userId = ctx.from;
            const respuesta = ctx.body.trim();
            console.log('✅ Respuesta capturada flujo principal:', respuesta);
            startInactivityTimer(userId, gotoFlow, ctx);

            if (!['1', '2', '3', '4'].includes(respuesta)) {
                return fallBack();
            }
        },
        [flowAgendar, flowVerificar]
    )

module.exports = {
    flowPrincipal
};