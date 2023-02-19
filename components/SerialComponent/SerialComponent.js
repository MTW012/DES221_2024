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
        this.delimiterChar = 0x0A;
        this.tokenBuffer = new Uint8Array();

        //this.serialInputProcessor = this.serialInputProcessor.bind(this);

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

        this.mainLabel = CustomSerial.newElement('div', 'customSerialMainLabel', 'main-label custom-serial-panel');
        this.mainLabel.innerHTML = "Serial Port";
        this.mainPanel.appendChild(this.mainLabel);
  
        // Toggle button to connect/disconnect to attached devices
        this.connectionPanel = CustomSerial.newElement('div', 'customSerialConnectionPanel', 'vertical-panel custom-serial-panel');
        this.mainPanel.appendChild(this.connectionPanel);
        // this.connectionLabel = CustomSerial.newElement('div', 'customSerialConnectionLabel', 'custom-serial-panel-label');
        // this.connectionLabel.innerHTML = "connect";
        // this.connectionPanel.appendChild(this.connectionLabel);
        this.connectButton = CustomSerial.newElement('button', 'customSerialConnectButton', 'port-toggle toggled-off');
        this.connectButton.innerHTML = "Connect";
        this.connectionPanel.appendChild(this.connectButton);
        this.connectButton.addEventListener('click', async () => {
            if (!this.connectedPort) { 
                // this.serialInputProcessor = this.createSerialInputProcessor(0x0A, this.handleToken.bind(this));
                
                // look for an attached microbit
                const usbVendorId = 0x0d28; // BBC Micro:bit
                try {
                    this.connectedPort = await navigator.serial.requestPort({ filters: [{ usbVendorId }]});
                    
                    // Connect to port
                    await this.connectedPort.open({ baudRate: 115200 });
                    this.connectButton.innerHTML = "Disconnect";
                    this.connectButton.classList.remove('toggled-off');
                    this.connectButton.classList.add('toggled-on');
                    
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
                    this.connectButton.classList.remove('toggled-on');
                    this.connectButton.classList.add('toggled-off');
                    
                } catch (e) {
                    console.warn(`Error disconnecting from microbit: ${e}`);
                }
            }
        });

        // button and text box for sending arbitrary strings to the attached device
        this.sendPanel = CustomSerial.newElement('div', 'customSerialSendPanel', 'vertical-panel custom-serial-panel');
        this.mainPanel.appendChild(this.sendPanel);
        
        // this.sendLabel = CustomSerial.newElement('div', 'customSerialSendLabel', 'custom-serial-panel-label');
        // this.sendLabel.innerHTML = "send";
        // this.sendPanel.appendChild(this.sendLabel);
        
        this.sendSerialSubPanel = CustomSerial.newElement('div', 'customSerialSendSubPanel', 'horizontal-panel', 'custom-serial-panel');
        this.sendPanel.appendChild(this.sendSerialSubPanel);

        this.sendSerialButton = CustomSerial.newElement('button', 'customSerialSendButton', 'serial-send-button');
        this.sendSerialButton.innerHTML = "Send";
        this.sendSerialSubPanel.appendChild(this.sendSerialButton);
        
        this.sendSerialTextBox = CustomSerial.newElement('input', 'customSerialSendTextBox', 'serial-send-textbox');
        this.sendSerialTextBox.type = 'text';
        this.sendSerialTextBox.value = 'Hello';
        this.sendSerialSubPanel.appendChild(this.sendSerialTextBox);

        this.sendSerialButton.addEventListener('click', (event) => {
            this.writeToSerial(this.sendSerialTextBox.value + "\n");
        });

        // Text area for receiving serial data, and button for forwarding to MIDI
        this.receivePanel = CustomSerial.newElement('div', 'customSerialReceivePanel', 'vertical-panel custom-serial-panel');
        this.mainPanel.appendChild(this.receivePanel);
        
        // this.receiveLabel = CustomSerial.newElement('div', 'customSerialReceiveLabel', 'custom-serial-panel-label');
        // this.receiveLabel.innerHTML = "receive";
        // this.receivePanel.appendChild(this.receiveLabel);
        
        this.serialReadoutElement = CustomSerial.newElement('div', 'customSerialReadout', 'custom-serial-readout');
        this.receivePanel.appendChild(this.serialReadoutElement);   
    }

    
    // Decode tokens as UTF8 strings and log them to the console
    handleToken = function(arr) {
        const stringValue = new TextDecoder().decode(arr);
        // console.log(stringValue.trim());
        const val = stringValue.trim();
        if (this.serialReadoutElement) {
            this.serialReadoutElement.innerHTML = val;
        }

        const midi = document.querySelector('custom-midi');
        if (midi) {
            const noteOnMatch = val.match(/NoteOn (\d+) (\d+) (\d+)/);
            if (noteOnMatch && noteOnMatch.length == 4) {
                midi.sendNoteOn(parseInt(noteOnMatch[1]), parseInt(noteOnMatch[2]), parseInt(noteOnMatch[3]));
            }
            const noteOffMatch = val.match(/NoteOff (\d+) (\d+) (\d+)/);
            if (noteOffMatch && noteOffMatch.length == 4) {
                midi.sendNoteOff(parseInt(noteOffMatch[1]), parseInt(noteOffMatch[2]), parseInt(noteOffMatch[3]));
            }
        }
    }


    expandTokenBuffer(arr) {
        let expandedBuffer = new Uint8Array(this.tokenBuffer.length + arr.length);
        expandedBuffer.set(this.tokenBuffer);
        expandedBuffer.set(arr, this.tokenBuffer.length);
        this.tokenBuffer = expandedBuffer;
    }
    
  
    serialInputProcessor(arr) {
        if (arr && arr.length) {
            let ind = arr.indexOf(this.delimiterChar);
            if (ind >= 0) {
                if (ind > 0) {
                    let part = arr.slice(0, ind);
                    this.expandTokenBuffer(part);
                }    
                try {
                    this.handleToken(this.tokenBuffer);
                } catch(e) {
                    console.log(`Malformed token ${this.tokenBuffer}: ${e}`);
                }
                this.tokenBuffer = new Uint8Array(); 
                this.serialInputProcessor(arr.subarray(ind+1));
            } else {
                this.expandTokenBuffer(arr);
            }
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
