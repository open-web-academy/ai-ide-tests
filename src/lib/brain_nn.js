// Create a Neural Network
const net = new brain.NeuralNetwork();

// Train the Network with 4 input objects
net.train([
// White RGB(255, 255, 255)
{input:[255/255, 255/255, 255/255], output:{light:1}},
// Lightgrey (192,192,192)
{input:[192/255, 192/255, 192/255], output:{light:1}},
// Darkgrey (64, 64, 64)
{ input:[65/255, 65/255, 65/255], output:{dark:1}},
// Black (0, 0, 0)
{ input:[0, 0, 0], output:{dark:1}},
]);

// What is the expected output of Dark Blue (0, 0, 128)?
let result = net.run([0, 0, 128/255]);

// Display the probability of "dark" and "light"
document.getElementById("demo").innerHTML =
"Dark: " + result["dark"] + "<br>" + "Light: " + result["light"];