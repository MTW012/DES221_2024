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
          let rawvalue=parseInt(messageparts[1]);
          if (rawvalue<500){
            agitationalertlevel=0;
          } else if (rawvalue<550){
            agitationalertlevel=1;
          } else if (rawvalue<600){
            agitationalertlevel=2
          }else if (rawvalue<650){
            agitationalertlevel=3
          }else if(rawvalue<700){
            agitationalertlevel=4
          }

            
          } else {
            agitationalertlevel=5;
          }
          setFireDangerLevel(agitationalertlevel)
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


