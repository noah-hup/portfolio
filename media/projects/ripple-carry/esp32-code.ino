#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LiquidCrystal.h>
#include <string.h>

#define BIT_COUNT 9
#define POLL_INTERVAL 50

const char* ssid = "xxx";
const char* password = "xxx";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

LiquidCrystal lcd(27, 14, 32, 33, 4, 5);
const uint8_t pins[BIT_COUNT] = {16,17,18,19,21,22,23,25,26};

uint16_t currentValue = 0;
uint16_t lastValue = 65535;
unsigned long lastPoll = 0;

uint16_t readInputs() {
  uint16_t value = 0;
  for (int i = 0; i < BIT_COUNT; i++) {
    value |= (digitalRead(pins[i]) << i);
  }
  return value;
}

void formatBinary(uint16_t value, char* buffer) {
  for (int i = BIT_COUNT - 1; i >= 0; i--) {
    *buffer++ = (value & (1 << i)) ? '1' : '0';
  }
  *buffer = '\0';
}

void updateLCD(uint16_t value) {
  char buf[17];
  char num[6];

  snprintf(num, sizeof(num), "%u", value);

  int len = strlen(num);
  int padding = (16 - len) / 2;

  memset(buf, ' ', 16);
  memcpy(buf + padding, num, len);
  buf[16] = '\0';

  lcd.setCursor(0, 0);
  lcd.print(buf);
}

void broadcastState() {
  char binary[BIT_COUNT + 1];
  formatBinary(currentValue, binary);

  char json[128];
  snprintf(json, sizeof(json),
    "{\"decimal\":%u,\"binary\":\"%s\",\"uptime\":%lu}",
    currentValue,
    binary,
    millis() / 1000
  );

  ws.textAll(json);
}

void onWebSocketEvent(AsyncWebSocket * server,
                      AsyncWebSocketClient * client,
                      AwsEventType type,
                      void * arg,
                      uint8_t *data,
                      size_t len) {

  if (type == WS_EVT_CONNECT) {
    broadcastState();
  }
}

const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ESP32 Enterprise Monitor</title>
<style>
body{margin:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont;color:#fff;}
.container{padding:20px;max-width:800px;margin:auto;}
.card{background:#1e293b;padding:20px;border-radius:16px;margin-bottom:20px;
box-shadow:0 10px 30px rgba(0,0,0,0.3);}
.decimal{font-size:64px;font-weight:600;color:#38bdf8;}
.binary{font-family:monospace;font-size:22px;letter-spacing:4px;}
.bits{display:flex;gap:10px;margin-top:15px;}
.bit{width:30px;height:30px;border-radius:6px;background:#334155;transition:0.2s;}
.bit.active{background:#38bdf8;}
.status-line{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:5px;}
.status-dot{width:10px;height:10px;border-radius:50%;}
.online{background:#22c55e;}
.offline{background:#ef4444;}
.connecting{background:#facc15;animation:pulse 1s infinite;}
@keyframes pulse{0%{opacity:1;}50%{opacity:0.4;}100%{opacity:1;}}
</style>
</head>
<body>
<div class="container">

<div class="card">
<div class="decimal" id="decimal">--</div>
<div class="binary" id="binary">---------</div>
<div class="bits" id="bits"></div>
</div>

<div class="card">
<div class="status-line">
<div id="statusDot" class="status-dot connecting"></div>
<span id="connection">Connecting...</span>
</div>
<div>Uptime: <span id="uptime">0</span>s</div>
</div>

</div>

<script>
let ws;
const bitsContainer=document.getElementById("bits");
const statusText=document.getElementById("connection");
const statusDot=document.getElementById("statusDot");

for(let i=0;i<9;i++){
  let d=document.createElement("div");
  d.className="bit";
  bitsContainer.appendChild(d);
}

function setStatus(state){
  statusDot.className="status-dot "+state;
  if(state==="online") statusText.innerText="Online";
  if(state==="offline") statusText.innerText="Disconnected";
  if(state==="connecting") statusText.innerText="Connecting...";
}

function connect(){
  setStatus("connecting");
  ws=new WebSocket(`ws://${location.host}/ws`);

  ws.onopen=()=>setStatus("online");

  ws.onclose=()=>{
    setStatus("offline");
    setTimeout(connect,1000);
  };

  ws.onmessage=(event)=>{
    const data=JSON.parse(event.data);
    document.getElementById("decimal").innerText=data.decimal;
    document.getElementById("binary").innerText=data.binary;
    document.getElementById("uptime").innerText=data.uptime;

    const bits=document.querySelectorAll(".bit");
    for(let i=0;i<9;i++){
      bits[i].classList.toggle("active", data.binary[i]==="1");
    }
  };
}
connect();
</script>

</body>
</html>
)rawliteral";

void setup() {

  for(int i=0;i<BIT_COUNT;i++)
    pinMode(pins[i], INPUT);

  lcd.begin(16,2);

  WiFi.softAP(ssid, password);

  ws.onEvent(onWebSocketEvent);
  server.addHandler(&ws);

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send_P(200, "text/html", index_html);
  });

  server.begin();
}

void loop() {

  unsigned long now = millis();

  if(now - lastPoll >= POLL_INTERVAL){
    lastPoll = now;

    currentValue = readInputs();

    if(currentValue != lastValue){
      updateLCD(currentValue);
      broadcastState();
      lastValue = currentValue;
    }
  }

  ws.cleanupClients();
}