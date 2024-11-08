// Select the custom serial component and message display area
const theSerialComponent = document.getElementById('customSerial');
const messagereadout = document.getElementById('messagereadout');
let agitationalertlevel = 0;

if (theSerialComponent && messagereadout) {
    // Set a custom handler for incoming messages
    theSerialComponent.customHandler = function(message) {
        // Display the message in the `messagereadout` element
        messagereadout.textContent = `Received Message: ${message}`;
        
        let messageParts = message.split(':');
        
        if (messageParts.length > 1) {
            let rawvalue = parseInt(messageParts[1]);
            
            // Determine the agitationalertlevel based on raw value
            if (rawvalue < 500) {
                agitationalertlevel = 0;  // Low
            } else if (rawvalue < 550) {
                agitationalertlevel = 1;  // Moderate
            } else if (rawvalue < 600) {
                agitationalertlevel = 2;  // High
            } else if (rawvalue < 650) {
                agitationalertlevel = 3;  // Very High
            } else if (rawvalue < 700) {
                agitationalertlevel = 4;  // Severe
            } else {
                agitationalertlevel = 5;  // Catastrophic (if this is a valid state)
            }
        } else {
            agitationalertlevel = 5; // Default to Catastrophic if no valid data
        }
        
        // Call function to update the fire danger level
        setFireDangerLevel(agitationalertlevel);
    };

    // Function to update the fire danger level (visual representation)
    function updateFireDangerLevel(level) {
      const semicircle = document.querySelector('.fire-danger-semicircle');
      
      // Remove all possible active levels (based on class names)
      semicircle.classList.remove('level-0', 'level-1', 'level-2', 'level-3', 'level-4');

      // Add the class corresponding to the current level
      semicircle.classList.add(`level-${level}`);
    }

    // Example: Set the fire danger to "Severe" initially (this is just for testing)
    setFireDangerLevel(4); // Set default level to "Severe"
}
