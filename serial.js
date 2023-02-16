let connectedPort;
let reader;
let keepReading = true;
let finishedReadingPromise;
let serialReadoutElement;

// Buffer to store characters until a delimiter is encountered
let tokenBuffer = new Uint8Array();
const expandTokenBuffer = (arr) => {
    let expandedBuffer = new Uint8Array(tokenBuffer.length + arr.length);
    expandedBuffer.set(tokenBuffer);
    expandedBuffer.set(arr, tokenBuffer.length);
    tokenBuffer = expandedBuffer;
}

// chunk serial input characters into tokens according to a given delimiter
const createSerialInputProcessor = (delimiterChar, tokenHandler) => {
    const processor = function (arr) {
        if (arr && arr.length) {
            let ind = arr.indexOf(delimiterChar);
            if (ind >= 0) {
                if (ind > 0) {
                    let part = arr.slice(0, ind);
                    expandTokenBuffer(part);
                    tokenHandler(tokenBuffer);
                    tokenBuffer = new Uint8Array(); 
                }
                processor(arr.subarray(ind+1));
            } else {
                expandTokenBuffer(arr);
            }
        }
    }
    return processor;
}

// Decode tokens as UTF8 strings and log them to the console
const handleToken = (arr) => {
    const stringValue = new TextDecoder().decode(arr);
    // console.log(stringValue.trim());
    if (serialReadoutElement) {
        serialReadoutElement.innerHTML = stringValue.trim();
    }
}

// setup a processor with this tokenHandler and delimited by newlines
const serialInputProcessor = createSerialInputProcessor(0x0A, handleToken);
    
const readSerialInput = async () => {
    while (connectedPort.readable && keepReading) {
        reader = connectedPort.readable.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              // reader has been canceled.
              break;
            }
            serialInputProcessor(value);
          }
        } catch (error) {
          console.warn(`Error parsing serial input: ${error}`);
        } finally {
          reader.releaseLock();
        }
    }

    await connectedPort.close();
}


// write data to the serial port
const writeToSerial = async (str) => {
    if (connectedPort) {
        const arr = new TextEncoder().encode(str);
        const writer = connectedPort.writable.getWriter();
        await writer.write(arr);

        // Allow the serial port to be closed later.
        writer.releaseLock();
    }
}


// Once the document is loaded we can add listeners that connect to serial ports etc.
document.addEventListener('DOMContentLoaded', async (event) => {
    
    serialReadoutElement = document.getElementById("serialReadout");
    const connectButton = document.getElementById("connectButton");
    connectButton.addEventListener('click', async () => {
        if (!connectedPort) { 
            // look for an attached microbit
            const usbVendorId = 0x0d28; // BBC Micro:bit
            try {
                connectedPort = await navigator.serial.requestPort({ filters: [{ usbVendorId }]});
                // Connect to port
                await connectedPort.open({ baudRate: 115200 });
                // const portInfo = connectedPort.getInfo();
                // console.log(`Found port 0x0${(portInfo.usbProductId).toString(16)} 0x0${(portInfo.usbVendorId).toString(16)}`);
                connectButton.innerHTML = "Disconnect";
                
                keepReading = true;
                finishedReadingPromise = readSerialInput();
                
            } catch(e) {
                console.warn(`Couldn't find any microbits: ${e}`);
            };
        } else {
            // disconnect
            try {
                keepReading = false;
                reader.cancel();
                await finishedReadingPromise;
                connectedPort = null;
                connectButton.innerHTML = "Connect";
            } catch (e) {
                console.warn(`Error disconnecting from microbit: ${e}`);
            }
        }
    });

    const helloButton = document.getElementById("helloButton");
    helloButton.addEventListener('click', async () => {
        if (connectedPort) {
            writeToSerial("Hello\n");
         }
    });
});
    

 
