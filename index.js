/// Updated fire danger names to include SEVERE and EXTREME
const fireDangerNames = ["LOW", "MODERATE", "HIGH", "VERY_HIGH", "SEVERE", "EXTREME"];

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
        alertLevel = 0;  // LOW
    } else if (heartRate < 80) {
        alertLevel = 1;  // MODERATE
    } else if (heartRate < 100) {
        alertLevel = 2;  // HIGH
    } else if (heartRate < 120) {
        alertLevel = 3;  // VERY HIGH
    } else if (heartRate < 140) {
        alertLevel = 4; // SEVERE
    } else {
        alertLevel = 5 ;  // EXTREME
    }

    setFireDangerLevel(alertLevel);
}

// Function to update the conic gradient based on alert level and highlight only the active segment
function updateGradient(level) {
    switch(level) {
        case 0: // LOW
            fireDangerSemicircle.style.background = `
                conic-gradient(#66bb6a 0deg 120deg, rgba(255,255,255,0.1) 120deg 360deg)`;
            break;
        case 1: // MODERATE
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 120deg, #ffeb3b 120deg 160deg, rgba(255,255,255,0.1) 160deg 360deg)`;
            break;
        case 2: // HIGH
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 160deg, #ff9800 160deg 200deg, rgba(255,255,255,0.1) 200deg 360deg)`;
            break;
        case 3: // VERY HIGH
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 200deg, #f44336 200deg 240deg, rgba(255,255,255,0.1) 240deg 360deg)`;
            break;
        case 4: // SEVERE
            fireDangerSemicircle.style.background = `
                conic-gradient(rgba(255,255,255,0.1) 0deg 240deg, #d32f2f 240deg 300deg, rgba(255,255,255,0.1) 300deg 360deg)`;
            break;
        case 5: // EXTREME
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
    if (level >= 4) { // SEVERE or EXTREME levels
        fireDangerSemicircle.classList.add('flashing');
    } else {
        fireDangerSemicircle.classList.remove('flashing');
    }
}

// Start the simulation
startFakeHeartRateStream();
