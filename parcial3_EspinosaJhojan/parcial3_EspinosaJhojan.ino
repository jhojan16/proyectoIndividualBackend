//Incluimos las librerias
#include <DHTesp.h>
#include <Arduino.h>
#include <PubSubClient.h>
#include <TimeLib.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include "time.h"

#define mqttUser ""
#define mqttPass ""
#define mqttPort 1883

//Definimos nuestras credenciales de la red WiFi
const char* ssid = "jhojan";
const char* password = "123456789";

//Definir broker e ID
//ip del servidor
char mqttBroker[] = "broker.mqtt-dashboard.com";
char mqttClientId[] = "mqttx_892bb7dc";

//Configuracion de la fecha
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;
const int daylightOffset_sec = 3600;

#define pinDHT 5
#define sensorPin 33
#define led 2
DHTesp dht;

//Callback
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  String json = String((char*)payload);
  Serial.println();

  StaticJsonDocument<300> estadoLuz;
  ;
  DeserializationError error = deserializeJson(estadoLuz, json);
  if (error) { return; }
  int estadoL = estadoLuz["estado"];

  //Serial.println(estado);
  if (estadoL == 1) {
    digitalWrite(led, HIGH);
    Serial.println("Encender riegos");
  } else {
    digitalWrite(led, LOW);
    Serial.println("Condiciones normales");
  }
}

WiFiClient BClient;
PubSubClient client(BClient);

//Funcion para obtener la hora
unsigned long hora() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Error al obtener la hora");
    return (0);
  }
  time(&now);
  return now;
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect(mqttClientId, mqttUser, mqttPass)) {
      Serial.println("connected");  // Once connected, publish an anouncement.
      client.subscribe("topicoLuz");
    } else {
      Serial.print("failed, rc=");

      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      delay(5000);
    }
  }
}
void setup() {
  Serial.begin(115200);  //Serial connection
  setup_wifi();          //WiFi connection
  client.setServer(mqttBroker, mqttPort);
  client.setCallback(callback);
  Serial.println("Setup done");
  delay(1500);
  //Inicializamos la fotocelda
  pinMode(sensorPin, INPUT);
  //inicializar led
  pinMode(led, OUTPUT);
  //Inicializamos el dht
  dht.setup(pinDHT, DHTesp::DHT11);
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Crear un objeto JSON StaticJsonDocument con capacidad suficiente
  StaticJsonDocument<256> jsonHumedad;
  StaticJsonDocument<256> jsonLuz;
  String variable;
  String variable2;

  unsigned long t_unix_date1 = hora() - 18000;
  // Obtener la fecha y hora en formato legible
  String fecha_hora = String(year(t_unix_date1)) + "/" + String(month(t_unix_date1)) + "/" + String(day(t_unix_date1)) + " " + String(hour(t_unix_date1)) + ":" + String(minute(t_unix_date1)) + ":" + String(second(t_unix_date1));

  // Leer del sensor humedad
  float humedad = dht.getHumidity();
  delay(2000);
  float valorHumedad = humedad;

  float valorAux2 = 0;

  //Condicional intervalo del 50% y 60% del humedad
  if (valorHumedad != valorAux2) {
    valorAux2 = valorHumedad;
    jsonHumedad["usuario_id"] = "01";
    jsonHumedad["id"] = "001";
    jsonHumedad["sensor"] = "Humedad";
    jsonHumedad["value"] = humedad;
    jsonHumedad["fecha y Hora"] = fecha_hora;
    serializeJsonPretty(jsonHumedad, variable);

    int lonHumedad = variable.length() + 1;
    Serial.println(variable);
    char datojson2[lonHumedad];
    variable.toCharArray(datojson2, lonHumedad);
    client.publish("SensorHumedad", datojson2);
    delay(100);
  }

  // Leer del sensor de luz
  int lectura = analogRead(sensorPin);
  int valor_mapeado = map(lectura, 2048, 0, 1, 100);
  int valor_escalado = constrain(valor_mapeado, 1, 100);
  delay(1000);
  int valorAux = 0;
  //Condicional 60% de cantidad de luz
  if (valor_escalado != valorAux) {
    valorAux = valor_escalado;
    jsonLuz["usuario_id"] = "01";
    jsonLuz["id"] = "001";
    jsonLuz["sensor"] = "Luz";
    jsonLuz["value"] = valor_escalado;
    jsonLuz["fecha y Hora"] = fecha_hora;
    serializeJsonPretty(jsonLuz, variable2);

    int lonLuz = variable2.length() + 1;
    Serial.println(variable2);
    char datojson1[lonLuz];
    variable2.toCharArray(datojson1, lonLuz);
    client.publish("SensorLuz", datojson1);
  }
  delay(3000);
  Serial.println();
}
