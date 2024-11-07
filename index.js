/// Ensure this is in `index.js` or inside a <script> tag within this HTML file

// Select the custom serial component and message display area
const theSerialComponent = document.getElementById('customSerial');
const messagereadout = document.getElementById('messagereadout');
let agitationalertlevel=0;
if (theSerialComponent && messagereadout) {
    // Set a custom handler for incoming messages
    theSerialComponent.customHandler = function(message) {
        // Display the message in the `messagereadout` element
        messagereadout.textContent = `Received Message: ${message}`;
        let messageparts= message.split(':');
        if (messageparts.length >1){
          agitationalertlevel=parseInt(messageparts[1])
        }
        
        
    };
     // Example of dynamically changing fire danger level (you can replace with logic for real-time data)
     function setFireDangerLevel(level) {
      const allLevels = document.querySelectorAll('.level');
      allLevels.forEach((el) => {
        el.classList.remove('active');
      });
      const activeLevel = document.querySelector(`.level.${level.toLowerCase().replace(" ", "-")}`);
      activeLevel.classList.add('active');
    }

    // Example: Set the fire danger to "Severe"
    setFireDangerLevel('Severe');
}

