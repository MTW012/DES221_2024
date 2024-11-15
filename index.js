/// Updated fire danger names to include SEVERE and EXTREME
const fireDangerNames = ["CALM", "MILD", "ELEVATED", "HEIGHTENED", "INTENSE", "CRITICAL"];

// Get HTML elements
const messagereadout = document.getElementById('messagereadout');
const fireDangerSemicircle = document.querySelector('.fire-danger-semicircle');

// Generates a random heart rate between 50 and 160 bpm
function generateFakeHeartRate() {
    return Math.floor(Math.random() * (160 - 50 + 1)) + 50;
}

// Sets up a stream of fake heart rate data
function startFakeHeartRateStream() {
    setInterval(() => {
        const heartRate = generateFakeHeartRate();
        console.log("Simulated Heart Rate:", heartRate);  // For debugging
        messagereadout.textContent = `Simulated Heart Rate: ${heartRate} bpm`;
        processHeartRateData(heartRate);
    }, 2000);  // Adjust frequency as needed
}

// Processes the heart rate data and assigns an alert level
function processHeartRateData(heartRate) {
    let alertLevel;

    if (heartRate < 60) {
        alertLevel = 0;  // CALM
    } else if (heartRate < 80) {
        alertLevel = 1;  // MILD
    } else if (heartRate < 100) {
        alertLevel = 2;  // ELEVATED
    } else if (heartRate < 120) {
        alertLevel = 3;  // HEIGHTENED
    } else if (heartRate < 140) {
        alertLevel = 4; // INTENSE
    } else {
        alertLevel = 5 ;  // CRITICAL
    }

    setFireDangerLevel(alertLevel);
}

// Function to update the conic gradient based on alert level and highlight only the active segment
function updateGradient(level) {
    switch(level) {
        case 0: // CALM
            fireDangerSemicircle.style.background = `
                conic-gradient(#66bb6a 0deg 120deg, rgba(255,255,255,0.1) 120deg 360deg)`;
            break;
        case 1: // MILD
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 120deg, #ffeb3b 120deg 160deg, rgba(255,255,255,0.1) 160deg 360deg)`;
            break;
        case 2: // ELEVATED
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 160deg, #ff9800 160deg 200deg, rgba(255,255,255,0.1) 200deg 360deg)`;
            break;
        case 3: // HEIGHTENED
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 200deg, #f44336 200deg 240deg, rgba(255,255,255,0.1) 240deg 360deg)`;
            break;
        case 4: // INTENSE
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 240deg, #d32f2f 240deg 300deg, rgba(255,255,255,0.1) 300deg 360deg)`;
            break;
        case 5: // CRITICAL
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 300deg, #b71c1c 300deg 360deg)`;
            break;
        default:
            fireDangerSemicircle.style.background = `
                conic-gradient(#66bb6a 0deg 120deg, #ffeb3b 120deg 160deg, #ff9800 160deg 200deg, #f44336 200deg 240deg, #d32f2f 240deg 300deg, #b71c1c 300deg 360deg)`;
    }
}

// Updates the UI to reflect the alert level and makes the semicircle flash if needed
function setFireDangerLevel(level) {
    const levelName = fireDangerNames[level] || "Unknown";
    console.log("Setting fire danger level to:", levelName);

    const allLevels = document.querySelectorAll('.level');
    allLevels.forEach((el) => el.classList.remove('active'));

    const activeLevel = document.querySelector(`.level.${levelName.toLowerCase().replace(" ", "-")}`);
    if (activeLevel) {
        activeLevel.classList.add('active');
    } else {
        console.log("Could not find an element for level:", levelName);
    }

    // Update the semicircle gradient based on alert level
    updateGradient(level);

    // Add or remove the flashing class based on alert level
    if (level >= 4) { // INTENSE or CRITICAL levels
        fireDangerSemicircle.classList.add('flashing');
    } else {
        fireDangerSemicircle.classList.remove('flashing');
    }
}


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



//----------- If you want to use the simulation, uncomment the next line, and comment out everything below it -------- //
//startFakeHeartRateStream();



// --------- If you want to use live bluettooth data, make sure the line above is commented out, and the area below is uncommented ------ //
const theSerialComponent = document.getElementById('customSerial');
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
                agitationalertlevel = 0;  // Calm
            } else if (rawvalue < 550) {
                agitationalertlevel = 1;  // Mild
            } else if (rawvalue < 600) {
                agitationalertlevel = 2;  // Elevated
            } else if (rawvalue < 650) {
                agitationalertlevel = 3;  // Heightened
            } else if (rawvalue < 700) {
                agitationalertlevel = 4;  // Intense
            } else {
                agitationalertlevel = 5;  // Critical (if this is a valid state)
            }
        } else {
            agitationalertlevel = 5; // Default to Critical  if no valid data
        }
        
        // Call function to update the fire danger level
        setFireDangerLevel(agitationalertlevel);
    };
}
