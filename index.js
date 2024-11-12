/// Ensure this is in `index.js` or inside a <script> tag within this HTML file
this.rxCharacteristic.addEventListener('characteristicvaluechanged', event => {
  const receivedData = event.target.value;
  console.log("Data received:", receivedData);
  processReceivedData(receivedData);  // Your processing function
});
this.rxCharacteristic.startNotifications();
await this.rxCharacteristic.startNotifications();
console.log("Notifications started");

function processReceivedData(data) {
  const textDecoder = new TextDecoder('utf-8');
  const message = textDecoder.decode(data.buffer);
  console.log("Decoded message:", message);
  // Then call the next function(s) with the decoded message
  handleData(message);  // Example of the next function
}


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
        const fireDangerLevels = {
          LOW: 'Low',
          MODERATE: 'Moderate',
          HIGH: 'High',
          VERY_HIGH: 'Very High',
          EXTREME: 'Extreme'
      };
      async function processFireDangerData(data) {
        try {
            const level = interpretDangerLevel(data); // Implement interpretation based on data format
            setActiveDangerLevel(level);
        } catch (error) {
            this.uBitBTDevice = null;
            this.rxCharacteristic = null;
            console.log("Error in fire danger level processing:", error);
        }
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
    }function setActiveDangerLevel(level) {
      switch(level) {
          case fireDangerLevels.LOW:
              console.log("Fire danger level is Low.");
              // Set behavior for Low danger level
              break;
          case fireDangerLevels.MODERATE:
              console.log("Fire danger level is Moderate.");
              // Set behavior for Moderate danger level
              break;
          case fireDangerLevels.HIGH:
              console.log("Fire danger level is High.");
              // Set behavior for High danger level
              break;
          case fireDangerLevels.VERY_HIGH:
              console.log("Fire danger level is Very High.");
              // Set behavior for Very High danger level
              break;
          case fireDangerLevels.EXTREME:
              console.log("Fire danger level is Extreme.");
              // Set behavior for Extreme danger level
              alertUserOfExtremeFireRisk(); // Example function to alert users
              break;
          default:
              console.log("Unknown fire danger level.");
      }
  }
  

    // Example: Set the fire danger to "Severe"
    setFireDangerLevel('Severe');


