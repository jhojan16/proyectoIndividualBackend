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

router.post('/login', (req, res) => {
    const { user, password } = req.body;

    // Consulta SQL para verificar las credenciales de inicio de sesión
    const query = 'SELECT * FROM usuarios WHERE user = ? AND password = ?';

    // Ejecutar la consulta SQL
    connection.query(query, [user, password], (error, results) => {
        if (error) {
            console.error('Error al verificar las credenciales de inicio de sesión:', error);
            res.status(500).json({ error: 'Error al verificar las credenciales de inicio de sesión' });
            return;
        }

        if (results.length === 1) {
            // Credenciales válidas
            const usuario = results[0];
            res.json({ mensaje: 'Inicio de sesión exitoso', usuario });
        } else {
            // Credenciales inválidas
            res.status(401).json({ error: 'Credenciales de inicio de sesión inválidas' });
        }
    });
});

module.exports = router;