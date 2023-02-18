// This is our custom web component, which implements Serial port access
class CustomSerial extends HTMLElement {

    // A utility function for creating a new html element with given id and class
    static newElement(tag, id, clsName) {
        const elem = document.createElement(tag);
        elem.className = clsName;
        elem.id = id;
        return elem;
    }

    constructor() {
        // Always call super first in constructor
        super();
        
        // class variables
        // this.connectedPort = null;
        // this.reader = null;
        this.keepReading = true;
        // this.finishedReadingPromise = null;
        // this.serialReadoutElement = null;
        this.tokenBuffer = new Uint8Array();

        // get access to the DOM tree for this element
        const shadow = this.attachShadow({mode: 'open'});
        
        // Apply customMidi external stylesheet to the shadow dom
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'components/SerialComponent/SerialComponent.css');

        // Attach the created elements to the shadow dom
        shadow.appendChild(linkElem);

        // create a top level full width strip to hold the component
        this.mainStrip = CustomSerial.newElement('div', 'customSerialMainStrip', 'custom-serial main-strip');
        shadow.appendChild(this.mainStrip);

        // Create a top level panel
        this.mainPanel = CustomSerial.newElement('div', 'customSerialMainPanel', 'custom-serial main-panel horizontal-panel');
        this.mainStrip.appendChild(this.mainPanel);

        this.mainLabel = CustomSerial.newElement('div', 'customSerialMainLabel', 'main-label');
        this.mainLabel.innerHTML = "Serial Ports";
        this.mainPanel.appendChild(this.mainLabel);
  
        // Toggle button to connect/disconnect to attached devices
        this.connectButton = CustomSerial.newElement('button', 'customSerialConnectButton', 'port-toggle toggled-off');
        this.connectButton.innerHTML = "Connect";
        this.mainPanel.appendChild(this.connectButton);
        this.connectButton.addEventListener('click', async () => {
            if (!this.connectedPort) { 
                this.serialInputProcessor = this.createSerialInputProcessor(0x0A, this.handleToken.bind(this));
                
                // look for an attached microbit
                const usbVendorId = 0x0d28; // BBC Micro:bit
                try {
                    this.connectedPort = await navigator.serial.requestPort({ filters: [{ usbVendorId }]});
                    
                    // Connect to port
                    await this.connectedPort.open({ baudRate: 115200 });
                    this.connectButton.innerHTML = "Disconnect";
                    
                    this.keepReading = true;
                    this.finishedReadingPromise = this.readSerialInput();
                    
                } catch(e) {
                    console.warn(`Couldn't find any microbits: ${e}`);
                };
            } else {
                // disconnect
                try {
                    this.keepReading = false;
                    this.reader.cancel();
                    await this.finishedReadingPromise;
                    this.connectedPort = null;
                    this.connectButton.innerHTML = "Connect";
                } catch (e) {
                    console.warn(`Error disconnecting from microbit: ${e}`);
                }
            }
        });

        // button and text box for sending arbitrary strings to the attached device
        this.sendSerialPanel = CustomSerial.newElement('div', 'customSerialSendPanel', 'horizontal-panel serial-send-panel');
        this.mainPanel.appendChild(this.sendSerialPanel);
        
        this.sendSerialButton = CustomSerial.newElement('button', 'customSerialSendButton', 'serial-send-button');
        this.sendSerialButton.innerHTML = "Send";
        this.sendSerialPanel.appendChild(this.sendSerialButton);
        
        this.sendSerialTextBox = CustomSerial.newElement('input', 'customSerialSendTextBox', 'serial-send-textbox');
        this.sendSerialTextBox.type = 'text';
        this.sendSerialTextBox.value = 'Hello';
        this.sendSerialPanel.appendChild(this.sendSerialTextBox);

        this.sendSerialButton.addEventListener('click', (event) => {
            this.writeToSerial(this.sendSerialTextBox.value);
        });

        this.serialReadoutElement = CustomSerial.newElement('div', 'customSerialReadout', 'custom-serial-readout');
        this.mainPanel.appendChild(this.serialReadoutElement);
    }

    
    expandTokenBuffer(arr) {
        let expandedBuffer = new Uint8Array(this.tokenBuffer.length + arr.length);
        expandedBuffer.set(this.tokenBuffer);
        expandedBuffer.set(arr, this.tokenBuffer.length);
        this.tokenBuffer = expandedBuffer;
    }
    
    // chunk serial input characters into tokens according to a given delimiter
    createSerialInputProcessor(delimiterChar, tokenHandler) {
        const processor = function (arr) {
            if (arr && arr.length) {
                let ind = arr.indexOf(delimiterChar);
                if (ind >= 0) {
                    if (ind > 0) {
                        let part = arr.slice(0, ind);
                        this.expandTokenBuffer(part);
                        tokenHandler(this.tokenBuffer);
                        this.tokenBuffer = new Uint8Array(); 
                    }
                    processor(arr.subarray(ind+1));
                } else {
                    this.expandTokenBuffer(arr);
                }
            }
        }
        return processor;
    }
    
    // Decode tokens as UTF8 strings and log them to the console
    handleToken(arr) {
        const stringValue = new TextDecoder().decode(arr);
        // console.log(stringValue.trim());
        if (this.serialReadoutElement) {
            this.serialReadoutElement.innerHTML = stringValue.trim();
        }
    }
    
    
    async readSerialInput() {
        while (this.connectedPort.readable && this.keepReading) {
            this.reader = this.connectedPort.readable.getReader();
            try {
              while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                  // reader has been canceled.
                  break;
                }
                this.serialInputProcessor(value);
              }
            } catch (error) {
              console.warn(`Error parsing serial input: ${error}`);
            } finally {
              this.reader.releaseLock();
            }
        }
    
        await this.connectedPort.close();
    }
    
    
    // write data to the serial port
    async writeToSerial(str) {
        if (this.connectedPort) {
            const arr = new TextEncoder().encode(str);
            const writer = this.connectedPort.writable.getWriter();
            await writer.write(arr);
    
            // Allow the serial port to be closed later.
            writer.releaseLock();
        }
    }

}

customElements.define('custom-serial', CustomSerial);
