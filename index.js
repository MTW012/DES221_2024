/// Ensure this is in `index.js` or inside a <script> tag within this HTML file

// Select the custom serial component and message display area
const theSerialComponent = document.getElementById('customSerial');
const messagereadout = document.getElementById('messagereadout');

if (theSerialComponent && messagereadout) {
    // Set a custom handler for incoming messages
    theSerialComponent.customHandler = function(message) {
        // Display the message in the `messagereadout` element
        messagereadout.textContent = `Received Message: ${message}`;
        
        // Optionally, you could add more handling here, e.g., updating a speedometer
        document.getElementById("speedometerReading").textContent = message;
    };
}
