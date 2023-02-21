// This will let you send a string from your web interface back to the microbit
// It adds a "newline" character at the end of the string, so that the microbit
// program can tell the command is complete
function sendStringToMicrobit(str) {
    const serialComponent = document.querySelector('custom-serial');
    if (serialComponent) {
        serialComponent.writeToSerial(`${str}\n`);
    }
}

// put any javascript you need for your interface here
// Get the buttons and slider elements
const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");
const slider = document.getElementById("mySlider");

// Add event listeners to the buttons
button1.addEventListener("click", function() {
  console.log("Heart Button clicked");
  sendStringToMicrobit("heart");
});

button2.addEventListener("click", function() {
  console.log("Diamond button clicked!");
  sendStringToMicrobit("diamond");
});

button3.addEventListener("click", function() {
  console.log("Square button clicked!");
  sendStringToMicrobit("square");
});

// Add event listener to the slider
slider.addEventListener("input", function() {
  console.log("Slider value changed to " + slider.value);
  sendStringToMicrobit(`sensitivity ${slider.value}`);
});

