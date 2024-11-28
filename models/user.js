class User {
    constructor({
        dni = "",
        name = "",
        email = "",
        cellphone = "",
    } = {}) { // Aquí se usa un objeto vacío como valor predeterminado
        this.dni = dni;
        this.name = name;
        this.email = email;
        this.cellphone = cellphone;
    }

    // Método para obtener los detalles completos del usuario
    toUserData() {
        return {
            dni: this.dni,
            name: this.name,
            email: this.email,
            cellphone: this.cellphone,
        };
    }

    // Método para actualizar el nombre del usuario
    setName(name) {
        this.name = name;
    }

    // Método para actualizar el correo del usuario
    setEmail(email) {
        this.email = email;
    }

    // Método para actualizar el número de celular del usuario
    setCellphone(cellphone) {
        this.cellphone = cellphone;
    }
}

module.exports = User;
