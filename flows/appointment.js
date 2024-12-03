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
let eventsId = [];
let event='';

function startInactivityTimer(userId, gotoFlow, flowDynamic, ctx) {
    // Si ya existe un temporizador para este usuario, lo limpiamos.
    if (sessions[userId]?.timeout) {
        clearTimeout(sessions[userId].timeout);
    }

    // Configuramos un nuevo temporizador de 5 minutos.
    sessions[userId] = {
        ...sessions[userId],
        timeout: setTimeout(async () => {
            console.log(`⏳ Tiempo de inactividad excedido para el usuario: ${userId}`);

            await flowDynamic('⏳ Tiempo de inactividad excedido......');

            await gotoFlow(flowCierre).then(() => {
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

const flowCierre = addKeyword(['2', 'no'])
    .addAction((ctx) => {
        const userId = ctx.from;
        clearInactivityTimer(userId);
        console.log('⏳ Temporizador Limpiado.')
    })
    .addAnswer(
        '¡Gracias por comunicarte! 😊 Si necesitas algo más, no dudes en contactarnos.')
    .addAnswer(
        '👨‍💻 *Información del Desarrollador:* \n' +
        '📛 *Nombre:* Juan Carlos Estévez Hidalgo \n' +
        '📧 *Correo:* juank20097@gmail.com \n' +
        '📱 *Teléfono:* +593 980365958 \n' +
        '📂 *Repositorio GitHub:* https://github.com/juank20097 \n')

const flowAgain = addKeyword('')
    .addAnswer([
        '*¿Hay algo más en lo que pueda ayudarte? 😊*',
        '',
        '👉 *1.* Sí',
        '👉 *2.* No'
    ],
        { capture: true },
        async (ctx, { gotoFlow, fallBack }) => {
            const respuesta = ctx.body.trim();
            console.log('✅ ayuda capturada:', respuesta);
            if (respuesta === '1' || respuesta === 'si' || respuesta === 'SI' || respuesta === 'Si') {
                return gotoFlow(flowOpciones);
            } else if (respuesta === '2' || respuesta === 'no' || respuesta === 'No' || respuesta === 'NO') {
                return gotoFlow(flowCierre);
            } else {
                return fallBack();
            }
        }
    )

/*--------------------------------flows de Cierre y Despedida------------------------------------------------*/

const flowValidateDate2 = addKeyword([date])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
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

        const maxEvents = parseInt(process.env.numberEvents || '1', 10);

        options = utilities.generateTimeSlots(
            date, process.env.startTime, process.env.endTime,
            process.env.duration, process.env.lunchTimeStart,
            process.env.lunchTimeEnd, events, maxEvents
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
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
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
                await flowDynamic([{ body: `*Cita seleccionada*: ${date}, ${startTimeF}-${endTimeF}` }]);
                await serviceCalendar.updateEvent(event.id, date, startTimeF,endTimeF);
                await flowDynamic(`✅ ¡La cita ha sido cambiada exitosamente!\n\nPor favor, revisa tu correo electrónico para confirmar cualquier detalle relacionado con tu cita. 📧`);
                return gotoFlow(flowAgain);
            } else {
                await flowDynamic('😕 ¡Parece que el dato ingresado no está en nuestra lista! No te preocupes, vamos a intentarlo de nuevo. 😊');
                return gotoFlow(flowBuscarCita2);
            }
        }
    );

const flowSelectDate = addKeyword([dni])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
        date = '';
        view_options = '';
        options = '';
        startTimeF = '';
        endTimeF = '';
    })
    .addAnswer(['🗓️ Para cambiar tu cita, indícanos la fecha en la que deseas programarla.',
        '',
        'Por favor, asegúrate de escribir la fecha en el siguiente formato: *(DD/MM/AAAA)*.'
    ],
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
            const respuesta = ctx.body.trim();
            console.log('✅ Fecha capturada:', respuesta);
            date = respuesta;
        },
        [flowValidateDate2]
    )

const flowBuscarCita3 = addKeyword([dni])
    .addAction(async (ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx); // Asegúrate de tener implementado `startInactivityTimer`

        try {
            // Llamada al servicio para buscar el evento
            const data2 = await serviceCalendar.searchEventByDni(dni);

            if (data2.items && data2.items.length > 0) {

                const user2 = await serviceUser.getUserByDni(dni); // Asegúrate de tener este servicio configurado
                const userName2 = user2 ? user2.name : 'usuario';

                // Saludo al usuario con su nombre
                await flowDynamic(
                    `👋 Hola, ${userName2}! Aquí tienes las citas agendadas:`
                );
                const now = new Date();
                // Itera sobre todos los eventos encontrados
                let index = 1;
                for (let event of data2.items) {
                    const eventDateTime = new Date(event.start.dateTime);
                    // Validar si la hora del evento es posterior a la hora actual
                    if (eventDateTime > now) {
                        const formattedDate = utilities.formatDateTime(event.start.dateTime);

                        eventsId.push({ index, id: event.id });
                        // Envia un mensaje por cada evento válido
                        await flowDynamic(
                            `*${index})* 📌 Cita: *${event.summary}*\n` +
                            `📄 Descripción: *${event.description}*\n` +
                            `⏰ Hora de la Cita: *${formattedDate}*\n`
                        );
                        index++;
                    }
                }
            } else {
                // No se encontró cita
                await flowDynamic(
                    '❌ No existe ninguna cita agendada con esa cédula o pasaporte.'
                );
                return gotoFlow(flowAgain);
            }
        } catch (error) {
            // Manejo de errores
            console.error('Error al buscar eventos:', error.message);
            await flowDynamic(
                '⚠️ Ocurrió un error al buscar la cita. Por favor, intenta nuevamente más tarde.'
            );
            return gotoFlow(flowAgain);
        }
    })
    .addAnswer(
        '📌 Por favor, ingresa el número de la cita que deseas cambiar:',
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
            const respuesta = ctx.body.trim(); // Captura la respuesta del usuario
            const index = parseInt(respuesta, 10); // Convierte la respuesta a número

            // Verifica si el índice existe en el vector
            event = eventsId.find((item) => item.index === index);

            if (event) {
               console.log('✅ Evento tomado: '+event.id);
            } else {
                // Si el índice no es válido, solicita intentarlo de nuevo
                await flowDynamic('😕 El número ingresado no corresponde a ningún evento.');
                return fallBack(); // Reinicia el flujo para solicitar nuevamente
            }
        },
        [flowSelectDate]
    )

const flowCambiar = addKeyword(['3'])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
        dni = '';
    })
    .addAnswer('Deseas realizar un cambio a tu cita agendada previamente.')
    .addAnswer(['📄 Por favor, ingresa tu número de cédula o pasaporte. 🔍',
    ],
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
            dni = ctx.body.trim();
            console.log('✅ DNI capturada:', dni);
        },
        [flowBuscarCita3]
    )

/*--------------------------------3) Cambiar Cita------------------------------------------------*/

const flowBuscarCita2 = addKeyword([dni])
    .addAction(async (ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx); // Asegúrate de tener implementado `startInactivityTimer`

        try {
            // Llamada al servicio para buscar el evento
            const data2 = await serviceCalendar.searchEventByDni(dni);

            if (data2.items && data2.items.length > 0) {

                const user2 = await serviceUser.getUserByDni(dni); // Asegúrate de tener este servicio configurado
                const userName2 = user2 ? user2.name : 'usuario';

                // Saludo al usuario con su nombre
                await flowDynamic(
                    `👋 Hola, ${userName2}! Aquí tienes las citas agendadas:`
                );
                const now = new Date();
                // Itera sobre todos los eventos encontrados
                let index = 1;
                for (let event of data2.items) {
                    const eventDateTime = new Date(event.start.dateTime);
                    // Validar si la hora del evento es posterior a la hora actual
                    if (eventDateTime > now) {
                        const formattedDate = utilities.formatDateTime(event.start.dateTime);

                        eventsId.push({ index, id: event.id });
                        // Envia un mensaje por cada evento válido
                        await flowDynamic(
                            `*${index})* 📌 Cita: *${event.summary}*\n` +
                            `📄 Descripción: *${event.description}*\n` +
                            `⏰ Hora de la Cita: *${formattedDate}*\n`
                        );
                        index++;
                    }
                }
            } else {
                // No se encontró cita
                await flowDynamic(
                    '❌ No existe ninguna cita agendada con esa cédula o pasaporte.'
                );
                return gotoFlow(flowAgain);
            }
        } catch (error) {
            // Manejo de errores
            console.error('Error al buscar eventos:', error.message);
            await flowDynamic(
                '⚠️ Ocurrió un error al buscar la cita. Por favor, intenta nuevamente más tarde.'
            );
            return gotoFlow(flowAgain);
        }
    })
    .addAnswer(
        '📌 Por favor, ingresa el número de la cita que deseas cancelar:',
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
            const respuesta = ctx.body.trim(); // Captura la respuesta del usuario
            const index = parseInt(respuesta, 10); // Convierte la respuesta a número

            // Verifica si el índice existe en el vector
            const evento = eventsId.find((item) => item.index === index);

            if (evento) {
                try {
                    // Llama al método para eliminar el evento
                    await serviceCalendar.cancelEvent(evento.id);

                    // Mensaje de confirmación
                    await flowDynamic(`✅ ¡La cita ha sido cancelada exitosamente!\n\nPor favor, revisa tu correo electrónico para confirmar cualquier detalle relacionado con tu cita. 📧`);
                    return gotoFlow(flowAgain);
                } catch (error) {
                    console.error('Error al eliminar el evento:', error.message);
                    await flowDynamic('⚠️ Hubo un problema al cancelar la cita. Por favor, inténtalo más tarde.');
                    return gotoFlow(flowAgain);
                }
            } else {
                // Si el índice no es válido, solicita intentarlo de nuevo
                await flowDynamic('😕 El número ingresado no corresponde a ningún evento.');
                return fallBack(); // Reinicia el flujo para solicitar nuevamente
            }
        }
    )


const flowCancelar = addKeyword(['4'])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
        dni = '';
    })
    .addAnswer('Entendemos que debas cancelar tu cita. 😔 Lamentamos cualquier inconveniente y estamos aquí para ayudarte en lo que necesites.')
    .addAnswer(['📄 Por favor, ingresa tu número de cédula o pasaporte para buscar la cita que deseas cancelar. 🔍',
    ],
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
            dni = ctx.body.trim();
            console.log('✅ DNI capturada:', dni);
        },
        [flowBuscarCita2]
    )

/*--------------------------------4) Cancelar Cita------------------------------------------------*/
const flowBuscarCita = addKeyword([''])
    .addAction(async (ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx); // Asegúrate de tener implementado `startInactivityTimer`

        try {
            // Llamada al servicio para buscar el evento
            const data = await serviceCalendar.searchEventByDni(dni);

            if (data.items && data.items.length > 0) {

                const user = await serviceUser.getUserByDni(dni); // Asegúrate de tener este servicio configurado
                const userName = user ? user.name : 'usuario';

                // Saludo al usuario con su nombre
                await flowDynamic(
                    `👋 Hola, ${userName}! Aquí tienes las citas agendadas:`
                );
                const now = new Date();
                // Itera sobre todos los eventos encontrados
                for (let event of data.items) {
                    const eventDateTime = new Date(event.start.dateTime);
                    // Validar si la hora del evento es posterior a la hora actual
                    if (eventDateTime > now) {
                        const formattedDate = utilities.formatDateTime(event.start.dateTime);
                        // Envia un mensaje por cada evento válido
                        await flowDynamic(
                            `📌 Cita: *${event.summary}*\n` +
                            `📄 Descripción: *${event.description}*\n` +
                            `⏰ Hora de la Cita: *${formattedDate}*\n`
                        );
                    }
                }
                await flowDynamic('🤝 Te esperamos con mucho gusto!')
                // Luego, si el evento fue encontrado, retornamos el flujo correspondiente
                return gotoFlow(flowAgain);
            } else {
                // No se encontró cita
                await flowDynamic(
                    '❌ No existe ninguna cita agendada con esa cédula o pasaporte.'
                );
                return gotoFlow(flowAgain);
            }
        } catch (error) {
            // Manejo de errores
            console.error('Error al buscar eventos:', error.message);
            return await flowDynamic(
                '⚠️ Ocurrió un error al buscar la cita. Por favor, intenta nuevamente más tarde.'
            );
        }
    });

const flowVerificar = addKeyword(['2'])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
        dni = '';
    })
    .addAnswer(['📄 Por favor, ingresa tu número de cédula o pasaporte para buscar la cita respectiva. 🔍',
    ],
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
            dni = ctx.body.trim();
            console.log('✅ DNI capturada:', dni);
        },
        [flowBuscarCita]
    )

/*--------------------------------------------2) Verificar-------------------------------------------------------------*/
const flowEmail = addKeyword('')
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
    })
    .addAnswer(
        `¡Gracias, ${user.name}! 🙏 Por favor, ingresa tu correo para enviarte los detalles de tu cita.`,
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);

            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ correo capturada:', respuesta);
            user.email = respuesta;
            user.cellphone = ctx.from.split('@')[0];
            await flowDynamic('✅ Has ingresado el correo: ' + user.email);
            await serviceUser.createUser(user.dni, user.name, user.email, user.cellphone);
            await serviceCalendar.createEvent(user.name, user.dni, user.email, date, startTimeF, endTimeF);
            return await flowDynamic('🎉 ¡Cita agendada con éxito! 📅 Revisa tu correo para más detalles.');
        },
        [flowAgain]
    )

const flowUser = addKeyword('1', 'si')
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
    })
    .addAnswer(
        ' Ingresa tu nombre completo, por favor. 😊',
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ nombre capturada:', respuesta);
            user.dni = dni;
            user.name = respuesta;
            return await flowDynamic('✅ Has ingresado el nombre: ' + user.name);
        },
        [flowEmail]
    )

const flowCreate = addKeyword('')
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);

        user = await serviceUser.getUserByDni(dni);
        if (user !== null) {
            await flowDynamic(`¡Hola ${user.name}! 👋 Un placer tenerte de nuevo.`)
            if (process.env.OtherEvent === 'false') {
                console.log('Ingresa al for'+process.env.OtherEvent)
                try {
                    // Buscar eventos de la cédula desde la fecha actual
                    const events = await serviceCalendar.searchEventByDni(dni);
                    if (events.items && events.items.length > 0) {
                        // Si existen eventos, mostrar los eventos encontrados
                        await flowDynamic('🔔 Al parecer tu ya tienes una cita con nosotros:')
                        for (let event of events.items) {
                            const formattedDate = utilities.formatDateTime(event.start.dateTime);
                            await flowDynamic(
                                `📌 Cita: *${event.summary}*\n` +
                                `📝 Descripción: *${event.description}*\n` +
                                `⏰ Hora de la Cita: *${formattedDate}*\n`
                            );
                        }
                        await flowDynamic('🤝 Te esperamos con mucho gusto!')
                        // Luego, si el evento fue encontrado, retornamos el flujo correspondiente
                        return gotoFlow(flowAgain); // Continúa al siguiente flujo (por ejemplo, para crear un evento)
                    }
                } catch (error) {
                    console.error('Error al buscar eventos:', error.message);
                    await flowDynamic('⚠️ Hubo un error al buscar el evento. Por favor, intenta nuevamente más tarde.');
                    return gotoFlow(flowAgain);
                }
            }
            await serviceCalendar.createEvent(user.name, user.dni, user.email, date, startTimeF, endTimeF);
            await flowDynamic('🎉 ¡Cita agendada con éxito! 📅 Revisa tu correo para más detalles.');
            return gotoFlow(flowAgain);
        } else {
            user = new User();
            await flowDynamic('❌ Al parecer no te tenemos registrado con nosotros.');
        }
    })
    .addAnswer(
        `¿El dato ingresado es correcto?\n\n👉 *1.* Sí\n👉 *2.* No`,
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);

            const respuesta = ctx.body.trim(); // Captura el DNI ingresado por el usuario
            console.log('✅ validación capturada:', respuesta);

            if (respuesta === '1' || respuesta === 'si' || respuesta === 'SI' || respuesta === 'Si') {
                console.log('✅ usuario no existente en la BDD')
            } else if (respuesta === '2' || respuesta === 'no' || respuesta === 'No' || respuesta === 'NO') {
                await flowDynamic('❌ Lamento que el dato esté incorrecto. ¡Intentémoslo de nuevo! 🔄')
                return gotoFlow(flowDni);
            } else {
                return fallBack();
            }
        },
        [flowUser]
    );


const flowDni = addKeyword(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
    })
    .addAnswer(['🌟 ¡Estamos casi listos!',
        '',
        'Por favor, ingresa tu cédula o pasaporte para continuar con el agendamiento. 😊'
    ],
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);

            dni = ctx.body.trim();
            console.log('✅ DNI capturado:', dni);
        },
        [flowCreate]
    );

const flowValidateDate = addKeyword([date])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
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

        const maxEvents = parseInt(process.env.numberEvents || '1', 10);

        options = utilities.generateTimeSlots(
            date, process.env.startTime, process.env.endTime,
            process.env.duration, process.env.lunchTimeStart,
            process.env.lunchTimeEnd, events, maxEvents
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
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
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
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
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
        async (ctx, { gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
            const respuesta = ctx.body.trim();
            console.log('✅ Fecha capturada:', respuesta);
            date = respuesta;
        },
        [flowValidateDate]
    )

/*-----------------------------------1) Agendar----------------------------------*/

const flowOpciones = addKeyword(['1', 'si'])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
    })
    .addAnswer([
        '📌 Por favor, ingresa el número de la opción que deseas realizar:',
        '',
        '1️⃣ Agendar Cita 📅',
        '2️⃣ Verificar Cita 🔍',
        '3️⃣ Cambiar Cita 🔄',
        '4️⃣ Cancelar Cita ❌ '
    ],
        { capture: true },
        async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);

            const respuesta = ctx.body.trim();
            console.log('✅ Respuesta capturada flujo principal:', respuesta);

            if (!['1', '2', '3', '4'].includes(respuesta)) {
                return fallBack();
            }
        },
        [flowAgendar, flowVerificar, flowCancelar, flowCambiar]
    )

const flowPrincipal = addKeyword(['citas'])
    .addAction((ctx, { gotoFlow, flowDynamic }) => {
        const userId = ctx.from;
        startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);
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
        async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
            const userId = ctx.from;
            const respuesta = ctx.body.trim();
            console.log('✅ Respuesta capturada flujo principal:', respuesta);
            startInactivityTimer(userId, gotoFlow, flowDynamic, ctx);

            if (!['1', '2', '3', '4'].includes(respuesta)) {
                return fallBack();
            }
        },
        [flowAgendar, flowVerificar, flowCancelar, flowCambiar]
    )

module.exports = {
    flowPrincipal
};