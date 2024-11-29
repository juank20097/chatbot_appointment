const Connection = require('../utilities/Connection'); // Importa la clase Connection

const dbService = new Connection(); // Instancia de la clase Connection

class UserService {
    // Obtener un usuario por DNI
    async getUserByDni(dni) {
        const sqlQuery = 'SELECT * FROM users WHERE dni = $1';
        try {
            // Ejecutar la consulta usando el pool de conexiones
            const result = await dbService.executeQuery(sqlQuery, [dni]);
            if (result.rows.length === 0) {
                return null; // Si no hay resultados, devolvemos null
            }
            return result.rows[0]; // Devuelve el registro encontrado
        } catch (error) {
            console.error('Error al obtener el usuario:', error);
            throw error;
        }
    }

    async createUser(dni, name, email, cellphone) {
        const sqlQuery = `
            INSERT INTO users (dni, name, email, cellphone) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        try {
            // Ejecutar la consulta usando el pool de conexiones
            const result = await dbService.executeQuery(sqlQuery, [dni, name, email, cellphone]);
            return result.rows[0]; // Devuelve el usuario creado
        } catch (error) {
            console.error('Error al crear el usuario:', error);
            throw error;
        }
    }

    async updateUser(dni, name, email, cellphone) {
        const sqlQuery = `
            UPDATE users 
            SET name = $1, email = $2, cellphone = $3 
            WHERE dni = $4 
            RETURNING *;
        `;
        try {
            // Ejecutar la consulta usando el pool de conexiones
            const result = await dbService.executeQuery(sqlQuery, [name, email, cellphone, dni]);
            if (result.rows.length === 0) {
                throw new Error('Usuario no encontrado');
            }
            return result.rows[0]; // Devuelve el usuario actualizado
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
            throw error;
        }
    }

    // Eliminar un usuario por DNI
    async deleteUser(dni) {
        const sqlQuery = `
            DELETE FROM users 
            WHERE dni = $1 
            RETURNING *;
        `;
        try {
            // Ejecutar la consulta usando el pool de conexiones
            const result = await dbService.executeQuery(sqlQuery, [dni]);
            if (result.rows.length === 0) {
                throw new Error('Usuario no encontrado');
            }
            return { message: 'Usuario eliminado', user: result.rows[0] }; // Devuelve el usuario eliminado
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
            throw error;
        }
    }
}

module.exports = UserService;
