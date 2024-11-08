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

    // Example of dynamically changing fire danger level (you can replace with logic for real-time data)
    function setFireDangerLevel(level) {
        const allLevels = document.querySelectorAll('.level');
        
        // Remove 'active' class from all levels
        allLevels.forEach((el) => {
            el.classList.remove('active');
        });
        
        // Dynamically map the level to the corresponding class name
        let levelClass = '';
        switch(level) {
            case 0:
                levelClass = 'low';
                break;
            case 1:
                levelClass = 'moderate';
                break;
            case 2:
                levelClass = 'high';
                break;
            case 3:
                levelClass = 'very-high';
                break;
            case 4:
                levelClass = 'severe';
                break;
            case 5:
                levelClass = 'catastrophic';
                break;
            default:
                levelClass = 'low'; // Default to low if no valid level
        }
        
        // Activate the class corresponding to the current fire danger level
        const activeLevel = document.querySelector(`.level.${levelClass}`);
        if (activeLevel) {
            activeLevel.classList.add('active');
        }
    }

    // Example: Set the fire danger to "Severe" initially (this is just for testing)
    setFireDangerLevel(4); // Set default level to "Severe"