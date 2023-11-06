// Get references to the CodeMirror editor and the output textarea
const outputTextarea = document.getElementById("output");
// Get a reference to the "Clear Code" button
const clearCodeButton = document.getElementById("clearCodeButton");
const codeTextarea = document.getElementById("code");
codeTextarea.value = "Initialising...\n"; 
const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: {
    name: "python",
    version: 3,
    singleLineStringErrors: false,
  },
  lineNumbers: true,
  indentUnit: 4,
  matchBrackets: true,
  lint: true, // Enable linting
});

// Initialize global variables
let pyodide; // To store Pyodide instance
let challengesData; // To store challenges data

// Function to load challenges based on the selected JSON file
async function loadChallenges(selectedJSON) {
  // Fetch and populate challenges data from the selected JSON file
  try {
    const response = await fetch(selectedJSON);
    const data = await response.json();
    challengesData = data;
    populateChallengeButtons();
  } catch (error) {
    console.error("Failed to fetch challenges data: ", error);
  }
}
// message while Initializing
outputTextarea.value = "Initializing...\n"; 

// Initialize the main application
async function initializeApp() {
  // Load Pyodide
  pyodide = await loadPyodide();
  // Indicate that Pyodide is ready
  clearOutput();
  outputTextarea.value += "Ready!\n";

  // Override the default print behavior to display in the "Output" textarea
  pyodide.globals.set("print", (s) => addToOutput(s));
  
  // Load the default challenge (Challenge 1)
  loadChallenge("Challenge 1");
}

// Function to add text to the output textarea
function addToOutput(s) {
  outputTextarea.value += "🐍" + s + "\n";
}

// Function to clear the output textarea
function clearOutput() {
  outputTextarea.value = "";
}

// Event listener to handle the button click
clearCodeButton.addEventListener("click", function () {
  // Clear the code in the CodeMirror editor
  editor.setValue("");
});

// Function to evaluate Python code
async function evaluatePython() {
  let code = editor.getValue();
  clearOutput(); // Clear the output before running the code

  try {
    const printedContent = await pyodide.runPythonAsync(code);
    if (printedContent !== undefined) {
      addToOutput(printedContent);
    }
  } catch (err) {
    addToOutput("Error: " + err.message);
  }
}

// Function to check syntax errors in the code
function checkSyntaxErrors(code) {
  try {
    // Attempt to parse and compile the code
    pyodide.pyimport('__future__').annotations({ full_pep560: true });
    pyodide.runPython(code);
    return null; // No syntax errors found
  } catch (err) {
    if (err.name === "SyntaxError") {
      // Customize the error message as needed
      return "Syntax Error: " + err.message;
    }
    return null; // Some other error occurred
  }
}

// Function to load a challenge's code into the editor and update details
function loadChallenge(challengeTitle) {
  if (challengesData && challengesData.challenges) {
    const selectedChallenge = challengesData.challenges.find(
      (challenge) => challenge.title === challengeTitle
    );
    if (selectedChallenge) {
      editor.setValue(selectedChallenge.pseudoCode); // Update pseudoCode
      updateChallengeDetails(
        challengesData.heading, // Use the heading from JSON
        selectedChallenge.title,
        selectedChallenge.description,
        selectedChallenge.expected_output
      );
    }
  }
}

// Function to update challenge details including expected output
function updateChallengeDetails(heading, title, description, expectedOutput) {
  const challengeTitle = document.getElementById("challengeTitle");
  const challengeDescription = document.getElementById("challengeDescription");
  const expectedOutputElement = document.getElementById("expected-output");

  challengeTitle.textContent = heading;
  challengeDescription.textContent = description;
  expectedOutputElement.textContent = "Expected Output: " + expectedOutput;
}

// Function to populate challenge buttons
function populateChallengeButtons() {
  const challengeButtons = document.querySelectorAll(".dropdown-item");

  challengeButtons.forEach((button) => {
    button.addEventListener("click", () =>
      loadChallenge(button.textContent.trim())
    );
  });
}

// Access the "Section Revision" button element
const sectionRevisionButton = document.getElementById("sectionRevisionButton");

// Add an event listener to handle the button click
sectionRevisionButton.addEventListener("click", function () {
  // Check if there's a section_revision_url in your JSON data
  if (challengesData && challengesData.section_revision_url) {
    // Navigate to the specified URL
    window.location.href = challengesData.section_revision_url;
  } else {
    // Provide a default URL in case the JSON data is missing
    window.location.href = "https://example.com/default-section-revision";
  }
});

// Read the selected JSON file from local storage
const selectedJSON = localStorage.getItem("selectedJSON");

// Load challenges based on the selected JSON file
loadChallenges(selectedJSON);

// Initialize the application
initializeApp();
