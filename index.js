// Select the custom serial component and message display area
const theSerialComponent = document.getElementById('customSerial');
const messagereadout = document.getElementById('messagereadout');
let agitationalertlevel = 0;

if (theSerialComponent && messagereadout) {
    // Set a custom handler for incoming messages
    theSerialComponent.customHandler = function(message) {
        console.log('Received message:', message);  // Check if the handler is triggered
        messagereadout.textContent = `Received Message: ${message}`;

        // Split the message into parts based on colon (':')
        let messageParts = message.split(':');
        if (messageParts.length > 1) {
            // Parse the second part of the message to an integer
            let rawValue = parseInt(messageParts[1]);
            console.log('Parsed raw value:', rawValue);  // Log the parsed value

            // Set the agitation alert level based on the rawValue
            if (rawValue < 500) {
                agitationalertlevel = 0; // Low risk
            } else if (rawValue < 550) {
                agitationalertlevel = 1; // Moderate risk
            } else if (rawValue < 600) {
                agitationalertlevel = 2; // Elevated risk
            } else if (rawValue < 650) {
                agitationalertlevel = 3; // High risk
            } else if (rawValue < 700) {
                agitationalertlevel = 4; // Very high risk
            } else {
                agitationalertlevel = 5; // Extreme risk
            }

            // Update the fire danger level on the page
            setFireDangerLevel(agitationalertlevel);
        } else {
            // If the message doesn't follow the expected format, set alert level to 5 (Extreme)
            agitationalertlevel = 5;
            setFireDangerLevel(agitationalertlevel);
        }
    };

    // Function to dynamically set the fire danger level
    function setFireDangerLevel(level) {
        console.log('Setting Fire Danger Level to:', level);  // Log the level being set

        // Select all level elements
        const allLevels = document.querySelectorAll('.level');
        
        // Remove the 'active' class from all levels
        allLevels.forEach((el) => {
            el.classList.remove('active');
            console.log('Removing active from:', el.className);  // Log removal
        });

        // Map numeric level to corresponding CSS class
        let levelClass = '';
        switch(level) {
            case 0: levelClass = 'low'; break;
            case 1: levelClass = 'moderate'; break;
            case 2: levelClass = 'high'; break;
            case 3: levelClass = 'very-high'; break;
            case 4: levelClass = 'severe'; break;
            case 5: levelClass = 'extreme'; break;
            default: levelClass = 'low'; break;
        }

        // Find the correct element for the given level and add the 'active' class
        const activeLevel = document.querySelector(`.level.${levelClass}`);
        if (activeLevel) {
            activeLevel.classList.add('active');
            console.log('Adding active to:', activeLevel.className);  // Log addition
        } else {
            console.error(`No level found for ${levelClass}`);
        }
    }

    // Simulating a message for testing purposes (remove this after testing with actual serial data)
    setTimeout(() => {
        const testMessage = 'temperature: 550';  // Simulated test message
        console.log('Simulating message:', testMessage);  // This log will appear
        theSerialComponent.customHandler(testMessage);    // Manually trigger the handler
    }, 1000);

} else {
    console.error('Required elements not found: #customSerial or #messagereadout');
}

