class EventDetails {
    constructor({
        kind = "calendar#event",
        etag = "",
        id = "",
        status = "confirmed",
        htmlLink = "",
        created = "",
        updated = "",
        summary = "",
        description = "",
        location = "",
        creator = { email: "" },
        organizer = { email: "", displayName: "", self: false },
        start = { dateTime: "", timeZone: "" },
        end = { dateTime: "", timeZone: "" },
        iCalUID = "",
        sequence = 0,
        attendees = [{ email: "", responseStatus: "" }],
        reminders = { useDefault: false, overrides: [{ method: "email", minutes: 1440 }] },
        eventType = "default"
    }) {
        this.kind = kind;
        this.etag = etag;
        this.id = id;
        this.status = status;
        this.htmlLink = htmlLink;
        this.created = created;
        this.updated = updated;
        this.summary = summary;
        this.description = description;
        this.location = location;
        this.creator = creator;
        this.organizer = organizer;
        this.start = start;
        this.end = end;
        this.iCalUID = iCalUID;
        this.sequence = sequence;
        this.attendees = attendees;
        this.reminders = reminders;
        this.eventType = eventType;
    }

    // Método para obtener los detalles completos del evento
    toEventDetailsData() {
        return {
            kind: this.kind,
            etag: this.etag,
            id: this.id,
            status: this.status,
            htmlLink: this.htmlLink,
            created: this.created,
            updated: this.updated,
            summary: this.summary,
            description: this.description,
            location: this.location,
            creator: this.creator,
            organizer: this.organizer,
            start: this.start,
            end: this.end,
            iCalUID: this.iCalUID,
            sequence: this.sequence,
            attendees: this.attendees,
            reminders: this.reminders,
            eventType: this.eventType
        };
    }

    // Método para agregar un asistente
    addAttendee(email, responseStatus = "needsAction") {
        this.attendees.push({ email, responseStatus });
    }

    // Método para actualizar el estado del evento
    setStatus(status) {
        this.status = status;
    }

    // Método para actualizar la descripción del evento
    setDescription(description) {
        this.description = description;
    }

    // Método para actualizar los recordatorios
    setReminders(reminders) {
        this.reminders = reminders;
    }
}

module.exports = EventDetails;
