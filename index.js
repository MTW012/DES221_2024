// HTML elements and simulated levels
const messagereadout = document.getElementById('messagereadout');

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
    } else {
        alertLevel = 4;  // EXTREME
    }

    setFireDangerLevel(alertLevel);
}

// Updates the UI to reflect the alert level
function setFireDangerLevel(level) {
    const fireDangerNames = ["LOW", "MODERATE", "HIGH", "VERY_HIGH", "EXTREME"];
    const levelName = fireDangerNames[level] || "Unknown";
    console.log("Setting fire danger level to:", levelName);

    // Remove 'active' class from all levels and set it on the appropriate level element
    const allLevels = document.querySelectorAll('.level');
    allLevels.forEach((el) => el.classList.remove('active'));

    const activeLevel = document.querySelector(`.level.${levelName.toLowerCase().replace(" ", "-")}`);
    if (activeLevel) {
        activeLevel.classList.add('active');
    } else {
        console.log("Could not find an element for level:", levelName);
    }
}

// Start the simulation
startFakeHeartRateStream();
