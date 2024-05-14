const express = require("express");
const router = express.Router();
const mqtt = require("mqtt");
const mysql = require("mysql");
var client = mqtt.connect("mqtt://broker.mqtt-dashboard.com");

const connection = mysql.createPool({
    connectionLimit: 500,
    host: "localhost",
    user: "root",
    password: "", //el password de ingreso a mysql
    database: "parcial3",
    port: 3306,
});

router.get("/datos/:id", (req, res) => {
    const { id } = req.params;

    // Consulta SQL para obtener los datos del usuario
    const queryUsuario = "SELECT * FROM usuarios WHERE id = ? and userType = 'admin'";

    // Consulta SQL para obtener todos los nodos existentes sin repetir
    const queryNodos = `
    SELECT DISTINCT idnodo
    FROM (
        SELECT idnodo FROM datoshumedad
        UNION
        SELECT idnodo FROM datosluz
    ) AS nodos;
    `;

    // Ejecutar ambas consultas en paralelo
    connection.query(queryUsuario, [id], (errorUsuario, resultUsuario) => {
        if (errorUsuario) {
            console.error("Error al obtener los datos del usuario:", errorUsuario);
            return res.status(500).json({ error: "Error al obtener los datos del usuario" });
        }
        connection.query(queryNodos, [id, id], (errorNodos, resultsNodos) => {
            if (errorNodos) {
                console.error("Error al obtener los nodos:", errorNodos);
                return res.status(500).json({ error: "Error al obtener los nodos" });
            }
            // Crear el JSON combinado
            const datos = {
                usuario: resultUsuario[0], // Solo se espera un usuario, por lo que tomamos el primer resultado
                nodos: resultsNodos, // Array de nodos
            };
            // Enviar el JSON combinado como respuesta
            if (resultUsuario.length === 0) {
                return res.status(401).json({ error: "Usuario no valido" });
            }
            res.json(datos);
        });
    });
});

router.get("/datosNodo/:idnodo", (req, res) => {
    const { idnodo } = req.params;

    // Consulta SQL para obtener los datos de humedad para el idnodo seleccionado
    const queryHumedad = "SELECT * FROM datoshumedad WHERE idnodo = ?";

    // Consulta SQL para obtener los datos de luz para el idnodo seleccionado
    const queryLuz = "SELECT * FROM datosluz WHERE idnodo = ?";

    // Ejecutar ambas consultas en paralelo
    connection.query(queryHumedad, [idnodo], (errorHumedad, resultsHumedad) => {
        if (errorHumedad) {
            console.error("Error al obtener los datos de humedad:", errorHumedad);
            res.status(500).json({ error: "Error al obtener los datos de humedad" });
            return;
        }

        connection.query(queryLuz, [idnodo], (errorLuz, resultsLuz) => {
            if (errorLuz) {
                console.error("Error al obtener los datos de luz:", errorLuz);
                res.status(500).json({ error: "Error al obtener los datos de luz" });
                return;
            }

            // Crear un objeto JSON con los resultados de ambas consultas
            const datos = {
                humedad: resultsHumedad,
                luz: resultsLuz,
            };

            // Enviar el objeto JSON como respuesta
            res.json(datos);
        });
    });
});


router.get("/estadoluz/:id", (req, res) => {
    const { id } = req.params;
    connection.getConnection((error, tempConn) => {
        if (error) {
            console.error(error.message);
            res.status(500).send("Error al conectar a la base de datos.");
        } else {
            console.log("Conexión correcta.");

            const query = `
        SELECT id, usuarioId,estado, fechahora FROM datosestadoluz
        WHERE idnodo = ?
        ORDER BY fechahora DESC`;

            tempConn.query(query, [id], (error, result) => {
                if (error) {
                    console.error(error.message);
                    res.status(500).send("Error en la ejecución del query.");
                } else {
                    tempConn.release();
                    if (result.length > 0) {
                        res.json(result);
                    } else {
                        res.status(404).json({
                            mensaje: "No se encontraron registros con ese idnodo.",
                        });
                    }
                }
            });
        }
    });
});

router.get("/estadohumedad/:id", (req, res) => {
    const { id } = req.params;
    connection.getConnection((error, tempConn) => {
        if (error) {
            console.error(error.message);
            res.status(500).send("Error al conectar a la base de datos.");
        } else {
            console.log("Conexión correcta.");

            const query = `
        SELECT id, usuarioId,estado, fechahora FROM datosestadohumedad
        WHERE idnodo = ?
        ORDER BY fechahora DESC`;

            tempConn.query(query, [id], (error, result) => {
                if (error) {
                    console.error(error.message);
                    res.status(500).send("Error en la ejecución del query.");
                } else {
                    tempConn.release();
                    if (result.length > 0) {
                        res.json(result);
                    } else {
                        res.status(404).json({
                            mensaje: "No se encontraron registros con ese idnodo.",
                        });
                    }
                }
            });
        }
    });
});

module.exports = router;