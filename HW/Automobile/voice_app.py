#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define LED_BUILTIN 2
#define SENSOR  27 //GPIO 핀은 27, Select pin num 27 for GPIO
#define Switch  26 //26번 핀을 Switch로 설정

long currentMillis = 0;
long previousMillis = 0;
int interval = 100;
boolean ledState = LOW;
float calibrationFactor = 4.5;
volatile byte pulseCount;
byte pulse1Sec = 0;
float flowRate;
unsigned int flowMilliLiters;
unsigned long totalMilliLiters;  //Flowmeter용 변수들, Variables for Flowmeter

int onoroff; // On,Off state


const char* ssid     = "----"; //SSID 입력
const char* password = "----"; //Password 입력

WiFiServer server(80);

void IRAM_ATTR pulseCounter()
{
  pulseCount++;
}

void setup()
{
    Serial.begin(115200);
    pinMode(SENSOR, INPUT_PULLUP);
    pulseCount = 0;
    flowRate = 0.0;
    flowMilliLiters = 0;
    totalMilliLiters = 0;
    previousMillis = 0;

    pinMode(Switch, INPUT);

    onoroff=1; //기본 state는 1로

    attachInterrupt(digitalPinToInterrupt(SENSOR), pulseCounter, FALLING);

    delay(10);

    // We start by connecting to a WiFi network

    Serial.println();
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected.");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    
    server.begin();

}

int value = 0;

void loop(){

    HTTPClient http;    
    http.begin("http://xxx.xxx.xxx.xxx:3000/Car_data");        // 웹 서버 주소
    http.addHeader("Content-Type", "application/json");

    onoroff = 1; // onoroff변수로 탈출했을 경우 다시 작동하게 reset
    
    WiFiClient client = server.available();   // listen for incoming clients
    if (client) {                             // if you get a client,
      Serial.println("New Client.");           // print a message out the serial port
      String currentLine = "";                // make a String to hold incoming data from the client


       while (client.connected()&& onoroff==1){
        if (client.available()) {             // if there's bytes to read from the client,
        char c = client.read();             // read a byte, then
        Serial.write(c);                    // print it out the serial monitor
        if (c == '\n') {                    // if the byte is a newline character
          Serial.println("if_c_start");

          // if the current line is blank, you got two newline characters in a row.
          // that's the end of the client HTTP request, so send a response:
          if (currentLine.length() == 0) {
            Serial.println("if_length_start");
            // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
            // and a content-type so the client knows what's coming, then a blank line:
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println();
            // break out of the while loop:
            break;
          } else {    // if you got a newline, then clear currentLine:
            currentLine = "";
          }
        } else if (c != '\r') {  // if you got anything else but a carriage return character,
          currentLine += c;      // add it to the end of the currentLine
        }


        
       onoroff = digitalRead(Switch); //Switch 값을 읽고 off state& reset 결정.
        currentMillis = millis();
        if (currentMillis - previousMillis > interval) {
          pulse1Sec = pulseCount;
          pulseCount = 0;
          flowRate = ((100.0 / (millis() - previousMillis)) * pulse1Sec) / calibrationFactor;
          previousMillis = millis();
          flowMilliLiters = (flowRate / 60) * 1000;
          totalMilliLiters += flowMilliLiters;
          Serial.print("Flow rate: ");
          Serial.print(int(flowRate));  // Print the integer part of the variable
          Serial.print("L/min");
          Serial.print("\t");       // Print tab space
          // Print the cumulative total of liters flowed since starting
          Serial.print("Output Liquid Quantity: ");
          Serial.print(totalMilliLiters);
          Serial.print("mL / ");
          c=client.read();

          delay(50);
          Serial.write(c);
          
          if (c != '\r') {  // if you got anything else but a carriage return character,
          currentLine += c;}

          onoroff = digitalRead(Switch); //Switch 값을 읽고 off state& reset 결정. 오류 나지 않게 수시로 값 확인

          if (onoroff==0) { 

                //스위치 값을 읽어 사용자가 바뀔 경우 JSON Data 생성, 기름을 mL단위로 서버에 전송
                
                StaticJsonBuffer<300> JSONbuffer;
                JsonObject& encoder = JSONbuffer.createObject();
                encoder["data"] = totalMilliLiters;
                char buffer[300];
                encoder.prettyPrintTo(buffer, sizeof(buffer));
                Serial.println("User changed, Sending value. Initializing Variables..");

                    // POST 후 결과 받음
                int httpResponseCode = http.POST(buffer);
                if(httpResponseCode>0){
                  String response = http.getString();
                  Serial.println(httpResponseCode);
                  Serial.println(response);
                  
                  pulseCount = 0;
                  flowRate = 0.0;
                  flowMilliLiters = 0;
                  totalMilliLiters = 0;
                  previousMillis = 0;  //변수 모두 초기화 후 탈출

                  }
                  else{
                    Serial.print("Error on sending POST: ");
                    Serial.println(httpResponseCode);
                    }
            }
        }
     }
    }
  }
}
