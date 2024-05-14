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

router.get("/", (req, res) => {
  res.status(200).send("Todo correcto en /user");
});

router.get("/info/:id", (req, res) => {
  const { id } = req.params;
  // Consulta SQL para obtener los datos del usuario
  const queryUsuario = "SELECT * FROM usuarios WHERE id = ?"; // Suponiendo que el usuario tiene ID 1

  // Consulta SQL para obtener todos los nodos existentes
  const queryNodos = `
  SELECT DISTINCT idnodo
  FROM (
      SELECT idnodo FROM datoshumedad WHERE usuarioId = ?
      UNION
      SELECT idnodo FROM datosluz WHERE usuarioId = ?
  ) AS nodos;
  `;

  // Ejecutar ambas consultas en paralelo
  connection.query(queryUsuario, [id], (errorUsuario, resultUsuario) => {
    if (errorUsuario) {
      console.error("Error al obtener los datos del usuario:", errorUsuario);
      res.status(500).json({ error: "Error al obtener los datos del usuario" });
      return;
    }
    connection.query(queryNodos, [id, id], (errorNodos, resultsNodos) => {
      if (errorNodos) {
        console.error("Error al obtener los nodos:", errorNodos);
        res.status(500).json({ error: "Error al obtener los nodos" });
        return;
      }
      // Crear el JSON combinado
      const datos = {
        usuario: resultUsuario[0], // Solo se espera un usuario, por lo que tomamos el primer resultado
        nodos: resultsNodos, // Array de nodos
      };
      // Enviar el JSON combinado como respuesta
      res.json(datos);
    });
  });
});


router.get("/infohumedad/:idnodo", (req, res) => {
  const { idnodo } = req.params;

  connection.getConnection((error, tempConn) => {
    if (error) {
      console.error(error.message);
      res.status(500).send("Error al conectar a la base de datos.");
    } else {
      console.log("Conexión correcta.");

      const query = `
      SELECT * FROM datoshumedad
      WHERE idnodo = ? 
      ORDER BY fechahora DESC 
      LIMIT 5`;

      tempConn.query(query, [idnodo], (error, result) => {
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

router.get("/infoluz/:idnodo", (req, res) => {
  const { idnodo } = req.params;

  connection.getConnection((error, tempConn) => {
    if (error) {
      console.error(error.message);
      res.status(500).send("Error al conectar a la base de datos.");
    } else {
      console.log("Conexión correcta.");

      const query = `
      SELECT * FROM datosluz
      WHERE idnodo = ? 
      ORDER BY fechahora DESC 
      LIMIT 5`;

      tempConn.query(query, [idnodo], (error, result) => {
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

router.get("/:id", (req, res) => {
  const { id } = req.params;

  connection.getConnection((error, tempConn) => {
    if (error) {
      console.error(error.message);
      res.status(500).send("Error al conectar a la base de datos.");
    } else {
      console.log("Conexión correcta.");

      const query = `
      SELECT id, estado, fechahora FROM datosestadoluz
      WHERE usuarioId = ? 
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
