const serviceCalendar = require('../services/serviceCalendar');
const serviceUser = require('../services/serviceUser');

(async () => {
    const calendarService = new serviceCalendar();
    const userService= new serviceUser();
    try {
        // Llama al método listCalendars para obtener y mostrar los calendarios
        //const calendars = await calendarService.listCalendars();
        // Después de obtener los calendarios, prueba obtener los eventos por fecha
        // const events = await calendarService.getEventsByDate('14/11/2024');
        // const createEvent = await calendarService.createEvent('Maria Estevez','1003422365','juank20097@yopmail.com','25/11/2024','10:00:00','11:00:00');
        // const createEvent2 = await calendarService.createEvent('Maria Estevez','1001551785','juank20097@yopmail.com','25/11/2024','14:00:00','15:00:00');
        // const createEvent3 = await calendarService.createEvent('Maria Estevez','1001314143','juank20097@yopmail.com','25/11/2024','15:00:00','16:00:00');
        // const createEvent4 = await calendarService.createEvent('Maria Estevez','1001314143','juank20097@yopmail.com','25/11/2024','16:00:00','17:00:00');

        const getUser = await userService.getUserByDni('1003422365');
        if (getUser===null){
            console.log('retorna null');
        }
        //const searchEvent = await calendarService.searchEventByDni('1003422365');
        //const cancelEvent = await calendarService.cancelEvent('8n4br0iseq45l81cppppikg3bo');
        //const updateEvent = await calendarService.updateEvent('0m44jn367aj2ksmjjncjuiufb0','20/11/2024','10:00:00','12:00:00')
        
        
        // Ejemplo de uso
        // const startTime = "8:00";
        // const endTime = "17:00";
        // const duration = "1:00";
        // const lunchTimeStart = "13:00";
        // const lunchTimeEnd = "14:00";

        // const timeSlots = generateTimeSlots(startTime, endTime, duration, lunchTimeStart, lunchTimeEnd);
        // console.log(timeSlots);
    } catch (error) {
        console.error('Error general:', error.message);
    }
})();

function generateTimeSlots(startTime, endTime, duration, lunchTimeStart, lunchTimeEnd) {
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

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = timeToMinutes(duration);
    const lunchStartMinutes = timeToMinutes(lunchTimeStart);
    const lunchEndMinutes = timeToMinutes(lunchTimeEnd);

    const timeSlots = [];
    let currentMinutes = startMinutes;

    while (currentMinutes + durationMinutes <= endMinutes) {
        // Verificar si el rango actual está dentro del almuerzo
        if (
            currentMinutes + durationMinutes <= lunchStartMinutes || 
            currentMinutes >= lunchEndMinutes
        ) {
            const slotStart = minutesToTime(currentMinutes);
            const slotEnd = minutesToTime(currentMinutes + durationMinutes);
            timeSlots.push(`${slotStart} - ${slotEnd}`);
        }
        currentMinutes += durationMinutes; // Avanzar al siguiente rango
    }

    return timeSlots;
}