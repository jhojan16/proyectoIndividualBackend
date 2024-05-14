var mqtt = require("mqtt");
const mysql = require("mysql");
const routes = require("./routes/routes.js");
const cors = require("cors");

const express = require("express"); //se indica que se requiere express
const app = express(); // se inicia express y se instancia en una constante de  nombre app.
const morgan = require("morgan"); //se indica que se requiere morgan
// settings

app.set("port", 3000); //se define el puerto en el cual va a funcionar el servidor;

app.use(morgan("dev")); //se indica que se va a usar morgan en modo dev

app.use(cors()); //se indica que se va a usar cors

app.use(express.json()); //se indica que se va a usar la funcionalidad para manejo de json de express

//Routes
//Inicializar las rutas del servidor y configurar las rutas en la app de express
routes(app);

app.get("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send("Este es el principal");
});

//var client = mqtt.connect('mqtt://localhost)
var client = mqtt.connect("mqtt://broker.mqtt-dashboard.com");

const connection = mysql.createPool({
    connectionLimit: 500,
    host: "localhost",
    user: "root",
    password: "", //el password de ingreso a mysql
    database: "parcial3",
    port: 3306,
});

client.on("connect", function () {
    client.subscribe("SensorHumedad", function (err) {
        if (err) {
            console.log("error en la subscripcion");
        } else {
            console.log("Subscripcion exitosa");
        }
    });
    client.subscribe("SensorLuz", function (err) {
        if (err) {
            console.log("error en la subscripcion");
        } else {
            console.log("Subscripcion exitosa");
        }
    });
});

client.on("message", function (topic, message) {
    // message is Buffer
    json1 = JSON.parse(message.toString());
    console.log(json1);
    let sensor = json1.sensor;
    if (sensor == "Humedad") {
        connection.getConnection(function (error, tempConn) {
            //conexion a mysql
            if (error) {
                //throw error; //en caso de error en la conexion
            } else {
                console.log("Conexion correcta.");
                tempConn.query(
                    "INSERT INTO datosHumedad VALUES(null, ?, ?, ?, now())",
                    [json1.usuario_id, json1.id , json1.value],
                    function (error, result) {
                        //se ejecuta lainserción
                        if (error) {
                            throw error;
                        } else {
                            console.log("datos almacenados"); //mensaje de respuesta en consola
                            if (json1.value <= 80) {
                                json2 = { estado: 1 };
                            } else if (json1.value > 80) {
                                json2 = { estado: 0 };
                            }
                            client.publish("topicoHumedad", JSON.stringify(json2));
                            tempConn.query(
                                "INSERT INTO datosEstadoHumedad VALUES(null, ?, ?, ?, now())",
                                [json1.usuario_id, json1.id, json2.estado],
                                function (error, result) {
                                    //se ejecuta lainserción
                                    if (error) {
                                        throw error;
                                    } else {
                                        tempConn.release();
                                        console.log("insert estado"); //mensaje de respuesta en consola
                                    }
                                    //client.end() //si se habilita esta opción el servicio termina
                                }
                            );
                        }
                        //client.end() //si se habilita esta opción el servicio termina
                    }
                );
            }
        });
    } else if (sensor == "Luz") {
        connection.getConnection(function (error, tempConn) {
            //conexion a mysql
            if (error) {
                //throw error; //en caso de error en la conexion
            } else {
                console.log("Conexion correcta.");
                tempConn.query(
                    "INSERT INTO datosLuz VALUES(null, ?, ?, ?, now())",
                    [json1.usuario_id, json1.id, json1.value],
                    function (error, result) {
                        //se ejecuta lainserción
                        if (error) {
                            throw error;
                        } else {
                            console.log("datos almacenados"); //mensaje de respuesta en consola
                            if (json1.value >= 60) {
                                json2 = { estado: 1 };
                                json3 = { estado: "encender riegos" };
                                
                            } else {
                                json2 = { estado: 0 };
                                json3 = { estado: "condiciones normales" };
                            }
                            client.publish("topicoLuz", JSON.stringify(json2));
                            tempConn.query(
                                "INSERT INTO datosEstadoLuz VALUES(null,?, ?, ?, now())",
                                [json1.usuario_id, json1.id, json3.estado],
                                function (error, result) {
                                    //se ejecuta lainserción
                                    if (error) {
                                        throw error;
                                    } else {
                                        tempConn.release();
                                        console.log("insert estado"); //mensaje de respuesta en consola
                                    }
                                    //client.end() //si se habilita esta opción el servicio termina
                                }
                            );
                        }
                        //client.end() //si se habilita esta opción el servicio termina
                    }
                );
            }
        });
    }
    //client.end() //si se habilita esta opción el servicio termina
});

app.listen(app.get("port"), () => {
    console.log(`Servidor en: http://localhost:${app.get("port")}`);
});

module.exports = client;