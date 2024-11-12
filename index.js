// Request access to a serial port and read data
async function connectSerialPort() {
  try {
      // Prompt the user to select any available serial port
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      // Create a text decoder for incoming serial data
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      // Continuously read data from the serial port
      while (true) {
          const { value, done } = await reader.read();
          if (done) {
              // Allow the serial port to be closed if no data
              console.log('Closing serial port.');
              reader.releaseLock();
              break;
          }
          if (value) {
              handleSerialData(value.trim());
          }
      }
  } catch (error) {
      console.error("Error with serial port:", error);
  }
}

// Function to process the incoming serial data
function handleSerialData(data) {
  console.log('Received data:', data);

  // Assuming data format is 'sensor: value', e.g., 'agitation: 600'
  let messageParts = data.split(':');
  if (messageParts.length > 1) {
      let rawValue = parseInt(messageParts[1]);
      if (!isNaN(rawValue)) {
          // Update the agitation alert level based on the parsed data
          let agitationalertlevel = getAgitationLevel(rawValue);
          setFireDangerLevel(agitationalertlevel);
      } else {
          console.warn("Received invalid data:", data);
      }
  }
}

// Function to map raw sensor value to agitation level
function getAgitationLevel(rawValue) {
  if (rawValue < 500) return 0;       // Low risk
  else if (rawValue < 550) return 1;  // Moderate risk
  else if (rawValue < 600) return 2;  // Elevated risk
  else if (rawValue < 650) return 3;  // High risk
  else if (rawValue < 700) return 4;  // Very high risk
  else return 5;                      // Extreme risk
}

// Initialize connection on button press or page load
document.getElementById('connectButton').addEventListener('click', connectSerialPort);

    // Function to dynamically set the fire danger level and update the gradient
function setFireDangerLevel(level) {
  console.log('Setting Fire Danger Level to:', level);  // Log the level being set

  // Select all level elements and the fire danger semicircle
  const allLevels = document.querySelectorAll('.level');
  const semicircle = document.querySelector('.fire-danger-semicircle');

  // Remove the 'active' class from all levels
  allLevels.forEach((el) => el.classList.remove('active'));

  // Map numeric level to corresponding CSS class and background gradient
  let levelClass = '';
  let gradientBackground = '';

  switch(level) {
      case 0:
          levelClass = 'low';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ccc 120deg 360deg)';  // Mostly green
          break;
      case 1:
          levelClass = 'moderate';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ffeb3b 120deg 160deg, #ccc 160deg 360deg)';  // Green to yellow
          break;
      case 2:
          levelClass = 'high';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ffeb3b 120deg 160deg, #ff9800 160deg 200deg, #ccc 200deg 360deg)';  // Green to orange
          break;
      case 3:
          levelClass = 'very-high';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ffeb3b 120deg 160deg, #ff9800 160deg 200deg, #f44336 200deg 240deg, #ccc 240deg 360deg)';  // Green to red
          break;
      case 4:
          levelClass = 'severe';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ffeb3b 120deg 160deg, #ff9800 160deg 200deg, #f44336 200deg 240deg, #d32f2f 240deg 360deg)';  // Green to dark red
          break;
      case 5:
          levelClass = 'extreme';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ffeb3b 120deg 160deg, #ff9800 160deg 200deg, #f44336 200deg 240deg, #d32f2f 240deg 300deg, #b71c1c 300deg 360deg)';  // Green to extreme dark red
          break;
      default:
          levelClass = 'low';
          gradientBackground = 'conic-gradient(#66bb6a 0deg 120deg, #ccc 120deg 360deg)';  // Default to low
          break;
  }

  // Apply the 'active' class to the appropriate level
  const activeLevel = document.querySelector(`.level.${levelClass}`);
  if (activeLevel) {
      activeLevel.classList.add('active');
  }

  // Apply the new gradient background to the semicircle
  if (semicircle) {
      semicircle.style.background = gradientBackground;
  } else {
      console.error('Semicircle element not found');
  }
}


    