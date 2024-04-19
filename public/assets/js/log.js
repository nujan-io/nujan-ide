// Backup the original console.error function
const originalConsoleError = console.error;

// Override console.error
console.error = function (...args) {
  logErrorToService(args);
  // Call the original console.error function with all the arguments
  originalConsoleError.apply(console, args);
};

function logErrorToService(args) {
  const logEvent = new CustomEvent("consoleError", {
    detail: { data: args },
  });
  document.dispatchEvent(logEvent);
}
