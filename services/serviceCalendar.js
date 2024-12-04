require('dotenv').config();
const MyService = require('../services/service');
const Event = require('../models/event')
const EventDetails = require('../models/eventDetails')
const Utilities = require('../utilities/utilities')
const moment = require('moment-timezone');

const utilities = new Utilities;

class CalendarService {
    constructor() {
        // Inicia MyService con la URL base de la API de Google Calendar
        this.apiService = new MyService('https://www.googleapis.com/calendar/v3');
    }

    // Método para listar los calendarios
    async listCalendars() {
        try {
            const response = await this.apiService.getData('/users/me/calendarList');
            console.log('Calendarios obtenidos:', response);
            return response;
        } catch (error) {
            console.error('Error al listar calendarios:', error.message);
            throw error;
        }
    }

    // Método para obtener eventos por fecha
    async getEventsByDate(date) {
        try {
            const startDate = utilities.castDate(date) + 'T00:00:00Z';
            const endDate = utilities.castDate(date) + 'T23:59:59Z';
            const response = await this.apiService.getData('/calendars/' + process.env.CALENDAR + '/events?timeMin=' + startDate + '&timeMax=' + endDate + '&singleEvents=true&orderBy=startTime');
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error al obtener eventos:', error.message);
            throw error;
        }
    }

    // Método para crear un evento
    async createEvent(name, dni, correo, date, startTime, endTime) {
        try {
            const startDate = utilities.castDate(date) + 'T' + startTime + ':00.000';
            const endDate = utilities.castDate(date) + 'T' + endTime + ':00.000';
            // Instanciamos un objeto de la clase Event con los detalles proporcionados
            const event = new Event({
                summary: 'Atención en: ' + process.env.ORG + ' para ' + name,
                description: dni + ' - Agenda de Atención.',
                location: process.env.LOCALIZACION,
                start: { dateTime: startDate, timeZone: 'America/Guayaquil' },
                end: { dateTime: endDate, timeZone: 'America/Guayaquil' }
            });

            event.addAttendee(correo);

            // Preparamos el cuerpo de la solicitud
            const eventData = event.toEventData(); // Esto obtiene el objeto de evento en formato adecuado para la API
            const eventDataJson = JSON.stringify(eventData, null, 2);
            // Realizamos la solicitud a la API de Google Calendar para crear el evento
            console.log(eventDataJson);
            const response = await this.apiService.postData('/calendars/' + process.env.CALENDAR + '/events?sendUpdates=all&sendNotifications=true', eventDataJson);

            console.log('Evento creado:', response);
            return response; // Retorna la respuesta del evento creado
        } catch (error) {
            console.error('Error al crear el evento:', error.message);
            throw error; // Lanza el error si algo sale mal
        }
    }

    // Método para buscar un evento por palabras clave en la descripción
    async searchEventByDni(dni) {
        try {
            const ecuadorTime = moment().tz('America/Guayaquil').format();
            const now = moment(ecuadorTime).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            // Obtiene los datos utilizando getData
            const data = await this.apiService.getData('/calendars/' + process.env.CALENDAR + '/events?q=' + dni + '&timeMin=' + now);
            if (data.items && data.items.length > 0) {
                // Itera sobre todos los eventos encontrados
                data.items.forEach((event) => {
                    const { date, time } = utilities.formatDateTime(event.start.dateTime);
                    console.log(`📅 Tema: ${event.summary}`);
                    console.log(`📝 Descripción: ${event.description}`);
                    console.log(`⏰ Fecha y Hora: ${date} - ${time}`);
                    console.log('-----------------------------------------');
                });
            } else {
                return 0;
            }
            return data;
        } catch (error) {
            console.error('Error al buscar eventos por palabra clave:', error.message);
            throw error;
        }
    }

    // Método para buscar un evento por su ID
    async searchEventById(eventId) {
        try {
            // Realiza la solicitud GET al endpoint con el ID del evento
            const data = await this.apiService.getData(
                `/calendars/` + process.env.CALENDAR + `/events/${eventId}`
            );
            if (data) {
                return data;
            } else {
                console.log('No se encontró ningún evento con ese ID.');
            }
        } catch (error) {
            console.error('Error al buscar el evento por ID:', error.message);
            throw error;
        }
    }

    // Método para buscar un evento por palabras clave en la descripción
    async cancelEvent(event_id) {
        try {
            // Obtiene los datos utilizando getData
            await this.apiService.deleteData('/calendars/' + process.env.CALENDAR + '/events/' + event_id + '?sendNotifications=true&sendUpdates=all');
            console.log(`Evento con ID ${event_id} cancelado exitosamente.`);
            return { status: 'success', message: 'Evento cancelado exitosamente' };
        } catch (error) {
            console.error('Error al cancelar el evento:', error.message);
            throw error;
        }
    }

    // Método para actualizar un evento
    async updateEvent(eventId, date, startTime, endTime) {
        try {
            // Busca el evento existente por ID
            const existingEvent = await this.searchEventById(eventId);

            if (!existingEvent) {
                throw new Error('No se encontró ningún evento con ese ID.');
            }

            // Casteamos la respuesta al objeto EventDetails
            const eventDetails = new EventDetails(existingEvent);

            // Modificamos las fechas de inicio y fin
            eventDetails.start = {
                dateTime: new Date(utilities.castDate(date) + 'T' + startTime + '-05:00').toISOString(),
                timeZone: 'America/Guayaquil'
            };
            eventDetails.end = {
                dateTime: new Date(utilities.castDate(date) + 'T' + endTime + '-05:00').toISOString(),
                timeZone: 'America/Guayaquil'
            };

            // Convertimos el objeto a datos de evento
            const updatedEventDataJson = JSON.stringify(eventDetails.toEventDetailsData(), null, 2);

            // Realizamos la solicitud de actualización a la API de Google Calendar
            const response = await this.apiService.putData(
                `/calendars/3080d2bac0049788c9b0be91f201de5c485906617b2da1951f7c776ed27ec3a2@group.calendar.google.com/events/${eventId}?sendUpdates=all&sendNotifications=true`,
                updatedEventDataJson
            );

            console.log('Evento actualizado:', response);
            return response; // Retorna la respuesta del evento actualizado
        } catch (error) {
            console.error('Error al actualizar el evento:', error.message);
            throw error; // Lanza el error si algo sale mal
        }
    }


}

module.exports = CalendarService;