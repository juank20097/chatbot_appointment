class Event {
    constructor({
        summary = "",
        description = "",
        location = "",
        start = { dateTime: "", timeZone: "" },
        end = { dateTime: "", timeZone: "" },
        attendees = [],
        reminders = { useDefault: false, overrides: [{ method: "email", minutes: 1440 }] },
        visibility = "default",
        eventType = "default"
    }) {
        this.summary = summary;
        this.description = description;
        this.location = location;
        this.start = start;
        this.end = end;
        this.attendees = attendees;
        this.reminders = reminders;
        this.visibility = visibility;
        this.eventType = eventType;
    }

    // Método para obtener la estructura completa del evento
    toEventData() {
        return {
            summary: this.summary,
            description: this.description,
            location: this.location,
            start: this.start,
            end: this.end,
            attendees: this.attendees,
            reminders: this.reminders,
            visibility: this.visibility,
            eventType: this.eventType
        };
    }

    // Método para establecer un recordatorio
    setReminder(method, minutes) {
        this.reminders = {
            useDefault: false,
            overrides: [{ method, minutes }]
        };
    }

    // Método para agregar un asistente
    addAttendee(email) {
        this.attendees.push({ email });
    }
}

module.exports = Event;