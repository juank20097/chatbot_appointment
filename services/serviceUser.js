// services/UserService.js
const pool = require('../utilities/db'); // Importa la configuración de la base de datos
const User = require('../models/user'); // Importa el modelo User

class UserService {
    // Obtener un usuario por DNI
    async getUserByDni(dni) {
        try {
            const result = await pool.query('SELECT * FROM users WHERE dni = $1', [dni]);
            if (result.rows.length === 0) {
                return null;
            }
            return new User(result.rows[0]).toUserData(); // Devuelve los datos del usuario
        } catch (err) {
            console.error(err);
            throw new Error('Error al obtener el usuario');
        }
    }

    // Crear un nuevo usuario
    async createUser(dni, name, email, cellphone) {
        const newUser = new User({ dni, name, email, cellphone });

        try {
            const result = await pool.query(
                'INSERT INTO users (dni, name, email, cellphone) VALUES ($1, $2, $3, $4) RETURNING *',
                [newUser.dni, newUser.name, newUser.email, newUser.cellphone]
            );
            return new User(result.rows[0]).toUserData(); // Devuelve el usuario creado
        } catch (err) {
            console.error(err);
            throw new Error('Error al crear el usuario');
        }
    }

    // Actualizar un usuario por DNI
    async updateUser(dni, name, email, cellphone) {
        const updatedUser = new User({ dni, name, email, cellphone });

        try {
            const result = await pool.query(
                'UPDATE users SET name = $1, email = $2, cellphone = $3 WHERE dni = $4 RETURNING *',
                [updatedUser.name, updatedUser.email, updatedUser.cellphone, dni]
            );
            if (result.rows.length === 0) {
                throw new Error('Usuario no encontrado');
            }
            return new User(result.rows[0]).toUserData(); // Devuelve el usuario actualizado
        } catch (err) {
            console.error(err);
            throw new Error('Error al actualizar el usuario');
        }
    }

    // Eliminar un usuario por DNI
    async deleteUser(dni) {
        try {
            const result = await pool.query('DELETE FROM users WHERE dni = $1 RETURNING *', [dni]);
            if (result.rows.length === 0) {
                throw new Error('Usuario no encontrado');
            }
            return { message: 'Usuario eliminado', user: result.rows[0] }; // Devuelve el usuario eliminado
        } catch (err) {
            console.error(err);
            throw new Error('Error al eliminar el usuario');
        }
    }
}

module.exports = UserService;
