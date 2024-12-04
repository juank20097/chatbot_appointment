const moment = require('moment');

class Utilities {
    // Método para formatear una fecha y hora en formato DD/MM/YYYY HH:mm
    formatDateTime(isoDate) {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // Método para convertir una fecha en formato DD/MM/YYYY a YYYY-MM-DD
    castDate(date) {
        const [day, month, year] = date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Método para convertir una fecha en formato YYYY-MM-DD a DD/MM/YYYY
    convertToDDMMYYYY(dateString) {
        if (!dateString) {
            throw new Error('La fecha ingresada es inválida.');
        }

        const [year, month, day] = dateString.split('-');

        // Validar que los componentes de la fecha sean válidos
        if (!year || !month || !day) {
            throw new Error('La fecha no tiene el formato YYYY-MM-DD.');
        }

        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }


    castDateFormat(dateString) {
        const [day, month, year] = dateString.split('/');

        // Asegurarse de que el día y el mes tengan dos dígitos
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = month.padStart(2, '0');

        // Retornar la fecha con formato DD/MM/YYYY
        return `${formattedDay}/${formattedMonth}/${year}`;
    }

    // Método para validar si una fecha tiene el formato DD/MM/YYYY
    validateDateFormat(dateString) {
        // Formatos permitidos
        const allowedFormats = ['D/M/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'DD/MM/YYYY'];
        // Validar la fecha contra los formatos permitidos
        return moment(dateString, allowedFormats, true).isValid();
    }

    // Método para validar si una fecha no es anterior a la fecha actual
    validateDateNotInPast(dateString) {
        const dateFormat = 'DD/MM/YYYY';
        const inputDate = moment(dateString, dateFormat);
        const today = moment().startOf('day'); // Fecha actual sin hora
        return inputDate.isSameOrAfter(today);
    }

    generateTimeSlots(date, startTime, endTime, duration, lunchTimeStart, lunchTimeEnd, events, maxEvents) {
        // Helper para convertir tiempo a minutos
        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Helper para convertir minutos a formato "HH:mm"
        const minutesToTime = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        // Obtener la fecha actual y los minutos actuales
        const currentDate = new Date();
        const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
        const todayISODate1 = currentDate.toISOString().split('T')[0];
        const todayISODate = this.convertToDDMMYYYY(todayISODate1);

        // Convertir eventos a rangos en minutos
        const eventRanges = events.map(event => {
            const eventStartMinutes = timeToMinutes(event.start.split('T')[1].slice(0, 5));
            const eventEndMinutes = timeToMinutes(event.end.split('T')[1].slice(0, 5));
            return { start: eventStartMinutes, end: eventEndMinutes };
        });

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const durationMinutes = timeToMinutes(duration);
        const lunchStartMinutes = timeToMinutes(lunchTimeStart);
        const lunchEndMinutes = timeToMinutes(lunchTimeEnd);

        const timeSlots = [];
        let slotStartMinutes = startMinutes;

        while (slotStartMinutes + durationMinutes <= endMinutes) {
            const slotEndMinutes = slotStartMinutes + durationMinutes;

            // Verificar si el rango actual está dentro del almuerzo
            const isLunchTime =
                slotStartMinutes < lunchEndMinutes && slotEndMinutes > lunchStartMinutes;

            // Verificar si el rango actual se solapa con algún evento
            const overlappingEvents = eventRanges.filter(event =>
                !(slotEndMinutes <= event.start || slotStartMinutes >= event.end)
            );

            const isOverlappingEvent = overlappingEvents.length >= maxEvents;

            // Verificar si es la fecha actual y el rango está en el pasado
            const isPastTime =
                date === todayISODate && slotStartMinutes < currentMinutes; // Comparar correctamente el inicio del rango

            // Agregar el slot si cumple las condiciones
            if (!isLunchTime && !isOverlappingEvent && !isPastTime) {
                timeSlots.push(
                    `${minutesToTime(slotStartMinutes)} - ${minutesToTime(slotEndMinutes)}`
                );
            }

            slotStartMinutes += durationMinutes; // Avanzar al siguiente rango
        }

        return timeSlots;
    }



    getDayOfWeek(dateString) {
        // Dividir el string de fecha 'DD/MM/YYYY' en sus componentes
        const [day, month, year] = dateString.split('/').map(Number);

        // Crear un objeto Date utilizando el formato correcto
        const date = new Date(year, month - 1, day);

        // Verificar si la fecha es válida
        if (isNaN(date)) {
            return 'Fecha inválida';
        }

        // Obtener el día de la semana (0 = Domingo, 6 = Sábado)
        const dayOfWeek = date.getDay();

        // Devolver 6 si es Sábado o 0 si es Domingo
        if (dayOfWeek === 6) {
            return 6; // Sábado
        } else if (dayOfWeek === 0) {
            return 0; // Domingo
        } else {
            return null; // Otro día (Lunes-Viernes)
        }
    }

    getTimeSlot(number, timeSlots) {

        const selectedSlot = timeSlots[number - 1]; // Obtener el ítem basado en el índice (ajustado a base 0)
        const match = selectedSlot.match(/(\d{2}:\d{2}) - (\d{2}:\d{2})/); // Usar regex para extraer las horas

        const [_, startTime, endTime] = match; // Extraer las horas de inicio y fin
        return { startTime, endTime };
    }

    isNumber(cadena) {
        // Expresión regular para validar solo números
        const soloNumeros = /^\d+$/;
        return soloNumeros.test(cadena);
    }

    generateStringArray(limit) {
        const result = [];
        for (let i = 1; i <= limit; i++) {
            result.push(i.toString());
        }
        return result;
    }

}

module.exports = Utilities;
