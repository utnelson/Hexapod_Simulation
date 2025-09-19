let port;
let writer;
let reader;
let keepReading = false;

// Verbindung zum seriellen Port herstellen
async function connectSerial() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    reader = port.readable.getReader();
    keepReading = true;
    readSerial();
  } catch (err) {
    console.error("Fehler beim Verbinden:", err);
    alert("Fehler beim Verbinden: " + err);
  }
}

let serialBuffer = "";
async function readSerial() {
  while (port && keepReading) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        const text = new TextDecoder().decode(value);
        serialBuffer += text;
        let lines = serialBuffer.split("\n");
        // Letzte Zeile bleibt im Buffer (unvollständig)
        serialBuffer = lines.pop();
        for (const line of lines) {
          appendSerialLog(line.trim()); // trim entfernt \r oder unnötige Leerzeichen
        }
      }
    } catch (err) {
      console.error("Fehler beim Lesen:", err);
      break;
    }
  }
}

function appendSerialLog(text) {
  const logDiv = document.getElementById("serialLog");
  if (!logDiv) return;

  logDiv.textContent += text + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
}

async function sendCoordinates() {
  if (!writer) {
    alert("Bitte erst verbinden!");
    return;
  }
  const x = parseFloat(document.getElementById("ikX").value);
  const y = parseFloat(document.getElementById("ikY").value);
  const z = parseFloat(document.getElementById("ikZ").value);
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    alert("Bitte gültige Zahlen für X, Y und Z eingeben!");
    return;
  }
  const cmd = `go ${x} ${y} ${z}\n`;
  await writer.write(new TextEncoder().encode(cmd));
  console.log("Gesendet:", cmd);
  appendSerialLog("Gesendet: " + cmd);
}

async function sendHome() {
  if (!writer) {
    alert("Bitte erst verbinden!");
    return;
  }
  const cmd = "home\n";
  await writer.write(new TextEncoder().encode(cmd));
  console.log("Gesendet:", cmd);
  appendSerialLog("Gesendet: " + cmd);
}

async function sendStop() {
  if (!writer) {
    alert("Bitte erst verbinden!");
    return;
  }
  const cmd = "stop\n";
  await writer.write(new TextEncoder().encode(cmd));
  console.log("Gesendet:", cmd);
  appendSerialLog("Gesendet: " + cmd);
}

async function sendWalk() {
  if (!writer) {
    alert("Bitte erst verbinden!");
    return;
  }

  // Punkte auslesen
  const points = [];
  for (let i = 0; i <= 3; i++) {
    const x = parseFloat(document.getElementById(`x${i}`).value);
    const y = parseFloat(document.getElementById(`y${i}`).value);
    const z = parseFloat(document.getElementById(`z${i}`).value);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      alert(`Bitte gültige Zahlen für P${i} eingeben!`);
      return;
    }

    points.push(`${x} ${y} ${z}`);
  }

  // Speed und Delay auslesen
  const speed = parseFloat(document.getElementById("speed").value);
  const delay = parseInt(document.getElementById("delay").value);

  if (isNaN(speed) || isNaN(delay)) {
    alert("Bitte gültige Werte für Speed und Delay eingeben!");
    return;
  }

  
  //const cmd = `walk ${points.join(" ")} ${speed} ${delay}\n`;
  const cmd = `walk ${points.join(" ")}\n`;

  await writer.write(new TextEncoder().encode(cmd));
  console.log("Gesendet:", cmd);
  appendSerialLog("Gesendet: " + cmd);
}

/*
async function disconnectSerial() {
  keepReading = false;
  if (reader) {
    await reader.cancel();
    reader.releaseLock();
  }
  if (writer) {
    writer.releaseLock();
  }
  if (port) {
    await port.close();
    alert("Serial getrennt!");
  }
}
  */
