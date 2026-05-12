'use strict';

// This file is a simple logging utility used throughout the app.
// It provides easy methods to log info, warnings, and errors to the console.
// It is imported and used in routes.js, controllers, and models for debugging and monitoring.

const logger = {  // Create and export a logger object that can be used anywhere in the app

  // Logs a normal informational message (used for general events like "user logged in")
  info: (message) => {
    console.log(`[INFO] ${message}`);  // Print the message to the console with an [INFO] prefix
  },

  // Logs a warning message (used when something unexpected but non-critical happens)
  warn: (message) => {
    console.warn(`[WARN] ${message}`);  // Print the message to the console with a yellow [WARN] prefix
  },

  // Logs an error message (used when something goes wrong, like a failed database operation)
  error: (message) => {
    console.error(`[ERROR] ${message}`);  // Print the message to the console with a red [ERROR] prefix
  }

};

export default logger;  // Export the logger object so other files (routes.js, controllers, etc.) can import and use it